#include <node_api.h>

#include <algorithm>
#include <array>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <vector>

namespace {
using Word = uint32_t;

void check(napi_status status) {
  if (status != napi_ok) throw std::runtime_error("Node-API call failed");
}

template<typename T>
void copyField(napi_env env, napi_value object, const char* key, std::vector<T>& out) {
  napi_value field;
  check(napi_get_named_property(env, object, key, &field));
  size_t count;
  void* data;
  napi_typedarray_type type;
  check(napi_get_typedarray_info(env, field, &type, &count, &data, nullptr, nullptr));
  const size_t width = type == napi_uint8_array ? 1 : type == napi_uint16_array ? 2 :
    (type == napi_uint32_array || type == napi_int32_array) ? 4 : 0;
  if (width != sizeof(T)) throw std::runtime_error("Unexpected table field width");
  out.resize(count);
  if (count) std::memcpy(out.data(), data, count * width);
}

struct Canonical {
  std::vector<Word> runCp, runLen;
  std::vector<Word> rowCp, rowStart, rowEdges, nodeStart, edgeSym;
  std::vector<int32_t> nodeTerminal;
};
struct Weights {
  std::vector<uint16_t> pageOf, secondaryCodes, treeCodes;
  std::vector<Word> offset, primaryCodes;
  std::vector<uint8_t> weights, len1, len2, len3, primaryLengths, secondaryLengths;
  std::vector<uint8_t> treeId, treeLengths, nextContext;
};
struct Encoder {
  Weights w;
  std::array<Canonical, 3> dictionaries;
  std::u16string input, spelling;
  std::vector<Word> scalars, symbols, cost, choice, next;
  std::vector<uint8_t> bytes;

  napi_value init(napi_env env, napi_callback_info info) {
    try {
      size_t argc = 2;
      napi_value args[2];
      check(napi_get_cb_info(env, info, &argc, args, nullptr, nullptr));
      if (argc != 2) throw std::runtime_error("Expected tables");
      auto field = [&](const char* key, auto& target) { copyField(env, args[0], key, target); };
      field("pageOf", w.pageOf);
      field("offset", w.offset);
      field("weights", w.weights);
      field("len1", w.len1);
      field("len2", w.len2);
      field("len3", w.len3);
      field("primaryCodes", w.primaryCodes);
      field("secondaryCodes", w.secondaryCodes);
      field("primaryLengths", w.primaryLengths);
      field("secondaryLengths", w.secondaryLengths);
      field("treeId", w.treeId);
      field("treeCodes", w.treeCodes);
      field("treeLengths", w.treeLengths);
      field("nextContext", w.nextContext);
      for (Word i = 0; i < dictionaries.size(); i++) {
        napi_value object;
        check(napi_get_element(env, args[1], i, &object));
        auto& d = dictionaries[i];
        auto load = [&](const char* key, auto& target) { copyField(env, object, key, target); };
        load("runCp", d.runCp);
        load("runLen", d.runLen);
        load("rowCp", d.rowCp);
        load("rowStart", d.rowStart);
        load("rowEdges", d.rowEdges);
        load("nodeStart", d.nodeStart);
        load("edgeSym", d.edgeSym);
        load("nodeTerminal", d.nodeTerminal);
      }
      return args[0];
    } catch (const std::exception& error) {
      napi_throw_error(env, nullptr, error.what());
      return nullptr;
    }
  }

  struct Writer {
    std::vector<uint8_t>& bytes;
    Word bits = 0, count = 0;
    void append(Word code, Word width) {
      bits = (bits << width) | code;
      count += width;
      while (count >= 8) {
        count -= 8;
        bytes.push_back(static_cast<uint8_t>(bits >> count));
      }
    }
    void finish() {
      if (count) append(0, 8 - count);
    }
  };

  int hanBase(Word cp) {
    if (cp >= 0x4e00 && cp <= 0x9fff) return 0xfb40;
    if ((cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x20000 && cp <= 0x2a6df)) return 0xfb80;
    return 0;
  }

  Word unit(Word at) {
    return (w.weights[at] << 8) | w.weights[at + 1];
  }

  void writeLevel(int level, Writer& writer) {
    Word context = 0;
    auto tertiary = [&](Word secondary, Word value) {
      Word tree = w.treeId[secondary * 5 + context];
      if (tree) {
        Word entry = tree * 32 + value;
        writer.append(w.treeCodes[entry], w.treeLengths[entry]);
      }
      context = w.nextContext[value];
    };
    for (Word cp : scalars) {
      Word slot = w.pageOf[cp >> 8] * 256 + (cp & 255);
      Word a = w.len1[slot], b = w.len2[slot], c = w.len3[slot];
      if (a + b + c == 0) {
        Word base = hanBase(cp);
        if (!base) continue;
        if (level == 1) {
          for (Word u : {base + (cp >> 15), (cp & 0x7fff) | 0x8000}) {
            writer.append(w.primaryCodes[u], w.primaryLengths[u]);
          }
        } else if (level == 2) writer.append(w.secondaryCodes[32], w.secondaryLengths[32]);
        else tertiary(32, 2);
        continue;
      }
      Word at = w.offset[slot];
      if (level == 1) {
        for (Word j = 0; j < a; j += 2) {
          Word u = unit(at + j);
          writer.append(w.primaryCodes[u], w.primaryLengths[u]);
        }
      } else if (level == 2) {
        for (Word j = 0; j < b; j += 2) {
          Word u = unit(at + a + j);
          writer.append(w.secondaryCodes[u], w.secondaryLengths[u]);
        }
      } else {
        for (Word j = 0; j < c; j += 2) tertiary(unit(at + a + j), unit(at + a + b + j));
      }
    }
  }

  void writeBinary(Word cp) {
    if (cp < 128) bytes.push_back(2 + cp);
    else if (cp < 0x800) {
      Word index = cp - 0x80;
      bytes.push_back(0x82 + (index >> 8));
      bytes.push_back(index);
    } else {
      Word index = cp - 0x800 - (cp > 0xdfff ? 0x800 : 0);
      bytes.push_back(0x8a + (index >> 16));
      bytes.push_back(index >> 8);
      bytes.push_back(index);
    }
  }

  int last(const std::vector<Word>& values, Word key) {
    return static_cast<int>(std::upper_bound(values.begin(), values.end(), key) - values.begin()) - 1;
  }

  void canonicalize(const Canonical& d) {
    symbols.clear();
    for (Word cp : scalars) {
      int run = last(d.runCp, cp);
      if (run >= 0 && cp - d.runCp[run] < d.runLen[run]) {
        symbols.push_back(~cp);
        continue;
      }
      int row = last(d.rowCp, cp);
      if (row >= 0 && d.rowCp[row] == cp) {
        symbols.insert(symbols.end(), d.rowEdges.begin() + d.rowStart[row], d.rowEdges.begin() + d.rowStart[row + 1]);
      }
    }

    const size_t n = symbols.size();
    cost.assign(n + 1, UINT32_MAX);
    cost[n] = 0;
    choice.resize(n);
    next.resize(n);
    for (size_t i = n; i-- > 0;) {
      auto relax = [&](Word cp, size_t end) {
        Word width = 1 + (cp >= 0x80) + (cp >= 0x800) + (cp >= 0x10000);
        if (cost[end] != UINT32_MAX && cost[end] + width < cost[i]) {
          cost[i] = cost[end] + width;
          choice[i] = cp;
          next[i] = end;
        }
      };
      Word edge = symbols[i];
      if (edge >= d.edgeSym.size()) {
        relax(~edge, i + 1);
        continue;
      }
      if (edge >= d.nodeStart[1]) continue;
      Word node = edge + 1;
      for (size_t j = i + 1; ; j++) {
        if (d.nodeTerminal[node] >= 0) relax(d.nodeTerminal[node], j);
        if (j == n || symbols[j] >= d.edgeSym.size()) break;
        Word symbol = d.edgeSym[symbols[j]];
        auto end = d.edgeSym.begin() + d.nodeStart[node + 1];
        auto it = std::lower_bound(d.edgeSym.begin() + d.nodeStart[node], end, symbol);
        if (it == end || *it != symbol) break;
        node = static_cast<Word>(it - d.edgeSym.begin()) + 1;
      }
    }
    if (cost[0] == UINT32_MAX) throw std::runtime_error("Missing spelling");
    spelling.clear();
    for (size_t i = 0; i < n; i = next[i]) {
      Word cp = choice[i];
      if (cp <= 0xffff) spelling.push_back(cp);
      else {
        spelling.push_back(0xd800 + ((cp - 0x10000) >> 10));
        spelling.push_back(0xdc00 + (cp & 1023));
      }
    }
  }

  void readString(napi_env env, napi_value value) {
    size_t length;
    check(napi_get_value_string_utf16(env, value, nullptr, 0, &length));
    input.resize(length + 1);
    check(napi_get_value_string_utf16(env, value, input.data(), input.size(), &length));
    input.resize(length);
  }

  void decodeScalars() {
    scalars.clear();
    for (size_t i = 0; i < input.size(); i++) {
      Word cp = input[i];
      if (cp >= 0xd800 && cp <= 0xdbff) {
        if (i + 1 == input.size() || input[i + 1] < 0xdc00 || input[i + 1] > 0xdfff)
          throw std::runtime_error("Expected well-formed UTF-16");
        cp = 0x10000 + ((cp - 0xd800) << 10) + (input[++i] - 0xdc00);
      }
      scalars.push_back(cp);
    }
  }

  napi_value copyToScratch(napi_env env, napi_value scratch) {
    size_t capacity;
    void* data;
    napi_typedarray_type type;
    check(napi_get_typedarray_info(env, scratch, &type, &capacity, &data, nullptr, nullptr));
    if (type != napi_uint8_array) throw std::runtime_error("Expected byte scratch");
    const double length = static_cast<double>(bytes.size());
    if (capacity >= bytes.size() && !bytes.empty()) std::memcpy(data, bytes.data(), bytes.size());
    napi_value result;
    check(napi_create_double(env, capacity < bytes.size() ? -length : length, &result));
    return result;
  }

  template<bool canonical>
  napi_value encode(napi_env env, napi_callback_info info) {
    try {
      size_t argc = 3;
      napi_value args[3], result;
      check(napi_get_cb_info(env, info, &argc, args, nullptr, nullptr));
      if (argc < 2 || w.pageOf.empty()) throw std::runtime_error("Expected initialized encoder");
      int32_t mode;
      check(napi_get_value_int32(env, args[1], &mode));
      if (mode < -2 || mode > 3) throw std::runtime_error("Invalid collation");
      if (canonical && (mode == -2 || mode == 0)) return args[0];
      readString(env, args[0]);
      bytes.clear();
      if (mode < 0) {
        for (auto& ch : input) {
          if (mode == -1 && ch >= 'a' && ch <= 'z') ch -= 'a' - 'A';
          if (!canonical) bytes.push_back(ch);
        }
        if (canonical) check(napi_create_string_utf16(env, input.data(), input.size(), &result));
        else if (argc == 3) return copyToScratch(env, args[2]);
        else check(napi_create_buffer_copy(env, bytes.size(), bytes.empty() ? "" : static_cast<const void*>(bytes.data()), nullptr, &result));
        return result;
      }
      decodeScalars();
      if (canonical) {
        canonicalize(dictionaries[mode - 1]);
        check(napi_create_string_utf16(env, spelling.data(), spelling.size(), &result));
        return result;
      }
      if (mode == 0) {
        for (Word cp : scalars) writeBinary(cp);
        bytes.push_back(1);
      } else {
        Writer writer{bytes};
        writer.append(1, 1);
        writeLevel(1, writer);
        writer.append(w.primaryCodes[0], w.primaryLengths[0]);
        if (mode >= 2) {
          writeLevel(2, writer);
          writer.append(w.secondaryCodes[0], w.secondaryLengths[0]);
        }
        if (mode == 3) writeLevel(3, writer);
        writer.finish();
      }
      if (argc == 3) return copyToScratch(env, args[2]);
      void* dst;
      napi_value buffer;
      check(napi_create_arraybuffer(env, bytes.size(), &dst, &buffer));
      std::memcpy(dst, bytes.data(), bytes.size());
      check(napi_create_typedarray(env, napi_uint8_array, bytes.size(), buffer, 0, &result));
      return result;
    } catch (const std::exception& error) {
      napi_throw_error(env, nullptr, error.what());
      return nullptr;
    }
  }
};

thread_local Encoder encoder;

napi_value initialize(napi_env env, napi_callback_info info) { return encoder.init(env, info); }
template<bool canonical>
napi_value encodeValue(napi_env env, napi_callback_info info) { return encoder.encode<canonical>(env, info); }
}

NAPI_MODULE_INIT() {
  const napi_property_descriptor methods[] = {
    {"init", nullptr, initialize, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"weight", nullptr, encodeValue<false>, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"canonical", nullptr, encodeValue<true>, nullptr, nullptr, nullptr, napi_default, nullptr}
  };
  if (napi_define_properties(env, exports, 3, methods) != napi_ok) return nullptr;
  return exports;
}
