!(function (r, t) {
  for (var e in t) r[e] = t[e];
})(
  exports,
  (function (r) {
    var t = {};
    function e(n) {
      if (t[n]) return t[n].exports;
      var o = (t[n] = { i: n, l: !1, exports: {} });
      return (r[n].call(o.exports, o, o.exports, e), (o.l = !0), o.exports);
    }
    return (
      (e.m = r),
      (e.c = t),
      (e.d = function (r, t, n) {
        e.o(r, t) || Object.defineProperty(r, t, { enumerable: !0, get: n });
      }),
      (e.r = function (r) {
        ('undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(r, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(r, '__esModule', { value: !0 }));
      }),
      (e.t = function (r, t) {
        if ((1 & t && (r = e(r)), 8 & t)) return r;
        if (4 & t && 'object' == typeof r && r && r.__esModule) return r;
        var n = Object.create(null);
        if (
          (e.r(n),
          Object.defineProperty(n, 'default', { enumerable: !0, value: r }),
          2 & t && 'string' != typeof r)
        )
          for (var o in r)
            e.d(
              n,
              o,
              function (t) {
                return r[t];
              }.bind(null, o)
            );
        return n;
      }),
      (e.n = function (r) {
        var t =
          r && r.__esModule
            ? function () {
                return r.default;
              }
            : function () {
                return r;
              };
        return (e.d(t, 'a', t), t);
      }),
      (e.o = function (r, t) {
        return Object.prototype.hasOwnProperty.call(r, t);
      }),
      (e.p = ''),
      e((e.s = 1))
    );
  })([
    function (r, t, e) {
      'use strict';
      var n = e(2);
      function o(r, t, e, n) {
        ((this.message = r),
          (this.expected = t),
          (this.found = e),
          (this.location = n),
          (this.name = 'SyntaxError'),
          'function' == typeof Error.captureStackTrace &&
            Error.captureStackTrace(this, o));
      }
      (!(function (r, t) {
        function e() {
          this.constructor = r;
        }
        ((e.prototype = t.prototype), (r.prototype = new e()));
      })(o, Error),
        (o.buildMessage = function (r, t) {
          var e = {
            literal: function (r) {
              return '"' + o(r.text) + '"';
            },
            class: function (r) {
              var t,
                e = '';
              for (t = 0; t < r.parts.length; t++)
                e +=
                  r.parts[t] instanceof Array
                    ? s(r.parts[t][0]) + '-' + s(r.parts[t][1])
                    : s(r.parts[t]);
              return '[' + (r.inverted ? '^' : '') + e + ']';
            },
            any: function (r) {
              return 'any character';
            },
            end: function (r) {
              return 'end of input';
            },
            other: function (r) {
              return r.description;
            },
          };
          function n(r) {
            return r.charCodeAt(0).toString(16).toUpperCase();
          }
          function o(r) {
            return r
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\0/g, '\\0')
              .replace(/\t/g, '\\t')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/[\x00-\x0F]/g, function (r) {
                return '\\x0' + n(r);
              })
              .replace(/[\x10-\x1F\x7F-\x9F]/g, function (r) {
                return '\\x' + n(r);
              });
          }
          function s(r) {
            return r
              .replace(/\\/g, '\\\\')
              .replace(/\]/g, '\\]')
              .replace(/\^/g, '\\^')
              .replace(/-/g, '\\-')
              .replace(/\0/g, '\\0')
              .replace(/\t/g, '\\t')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/[\x00-\x0F]/g, function (r) {
                return '\\x0' + n(r);
              })
              .replace(/[\x10-\x1F\x7F-\x9F]/g, function (r) {
                return '\\x' + n(r);
              });
          }
          return (
            'Expected ' +
            (function (r) {
              var t,
                n,
                o,
                s = new Array(r.length);
              for (t = 0; t < r.length; t++) s[t] = ((o = r[t]), e[o.type](o));
              if ((s.sort(), s.length > 0)) {
                for (t = 1, n = 1; t < s.length; t++)
                  s[t - 1] !== s[t] && ((s[n] = s[t]), n++);
                s.length = n;
              }
              switch (s.length) {
                case 1:
                  return s[0];
                case 2:
                  return s[0] + ' or ' + s[1];
                default:
                  return s.slice(0, -1).join(', ') + ', or ' + s[s.length - 1];
              }
            })(r) +
            ' but ' +
            (function (r) {
              return r ? '"' + o(r) + '"' : 'end of input';
            })(t) +
            ' found.'
          );
        }),
        (r.exports = {
          SyntaxError: o,
          parse: function (r, t) {
            t = void 0 !== t ? t : {};
            var e,
              s = {},
              u = { start: Da },
              a = Da,
              i = function (r, t) {
                return Tb(r, t);
              },
              c = function (r, t) {
                return Tb(r, t, 1);
              },
              l = Oa('IF', !0),
              f = Oa('CASCADED', !0),
              b = Oa('LOCAL', !0),
              p = Oa('CHECK', !0),
              v = Oa('OPTION', !1),
              d = Oa('ALGORITHM', !0),
              y = Oa('UNDEFINED', !0),
              w = Oa('MERGE', !0),
              L = Oa('TEMPTABLE', !0),
              C = Oa('SQL', !0),
              h = Oa('SECURITY', !0),
              m = Oa('DEFINER', !0),
              E = Oa('INVOKER', !0),
              A = function (r, t) {
                return Tb(r, t);
              },
              T = Oa('AUTO_INCREMENT', !0),
              I = Oa('UNIQUE', !0),
              _ = Oa('KEY', !0),
              S = Oa('PRIMARY', !0),
              N = Oa('@', !1),
              g = Oa('BEFORE', !0),
              R = Oa('AFTER', !0),
              O = Oa('FOR', !0),
              x = Oa('EACH', !0),
              j = Oa('ROW', !0),
              k = Oa('STATEMENT', !0),
              U = Oa('FOLLOWS', !0),
              M = Oa('PRECEDES', !0),
              D = Oa('COLUMN_FORMAT', !0),
              P = Oa('FIXED', !0),
              G = Oa('DYNAMIC', !0),
              F = Oa('DEFAULT', !0),
              $ = Oa('STORAGE', !0),
              H = Oa('DISK', !0),
              Y = Oa('MEMORY', !0),
              B = Oa('GENERATED', !0),
              W = Oa('ALWAYS', !0),
              V = Oa('AS', !0),
              q = Oa('STORED', !0),
              X = Oa('VIRTUAL', !0),
              K = Oa('if', !0),
              Q = Oa('exists', !0),
              Z = Oa('INSTANT', !0),
              z = Oa('INPLACE', !0),
              J = Oa('COPY', !0),
              rr = Oa('LOCK', !0),
              tr = Oa('NONE', !0),
              er = Oa('SHARED', !0),
              nr = Oa('EXCLUSIVE', !0),
              or = Oa('CHANGE', !0),
              sr = Oa('FIRST', !0),
              ur = Oa('FOREIGN', !0),
              ar = Oa('NOCHECK', !0),
              ir = Oa('NOT', !0),
              cr = Oa('REPLICATION', !0),
              lr = Oa('FOREIGN KEY', !0),
              fr = Oa('ENFORCED', !0),
              br = Oa('MATCH FULL', !0),
              pr = Oa('MATCH PARTIAL', !0),
              vr = Oa('MATCH SIMPLE', !0),
              dr = Oa('RESTRICT', !0),
              yr = Oa('CASCADE', !0),
              wr = Oa('SET NULL', !0),
              Lr = Oa('NO ACTION', !0),
              Cr = Oa('SET DEFAULT', !0),
              hr = Oa('CHARACTER', !0),
              mr = Oa('SET', !0),
              Er = Oa('CHARSET', !0),
              Ar = Oa('COLLATE', !0),
              Tr = Oa('AVG_ROW_LENGTH', !0),
              Ir = Oa('KEY_BLOCK_SIZE', !0),
              _r = Oa('MAX_ROWS', !0),
              Sr = Oa('MIN_ROWS', !0),
              Nr = Oa('STATS_SAMPLE_PAGES', !0),
              gr = Oa('CHECKSUM', !1),
              Rr = Oa('DELAY_KEY_WRITE', !1),
              Or = /^[01]/,
              xr = xa(['0', '1'], !1, !1),
              jr = Oa('CONNECTION', !0),
              kr = Oa('COMPRESSION', !0),
              Ur = Oa("'", !1),
              Mr = Oa('ZLIB', !0),
              Dr = Oa('LZ4', !0),
              Pr = Oa('ENGINE', !0),
              Gr = function (r, t, e) {
                return {
                  keyword: r.toLowerCase(),
                  symbol: t,
                  value: e.toUpperCase(),
                };
              },
              Fr = Oa('ROW_FORMAT', !0),
              $r = Oa('COMPRESSED', !0),
              Hr = Oa('REDUNDANT', !0),
              Yr = Oa('COMPACT', !0),
              Br = Oa('READ', !0),
              Wr = Oa('LOW_PRIORITY', !0),
              Vr = Oa('WRITE', !0),
              qr = function (r, t) {
                return Tb(r, t);
              },
              Xr = Oa('BINARY', !0),
              Kr = Oa('MASTER', !0),
              Qr = Oa('LOGS', !0),
              Zr = Oa('TRIGGERS', !0),
              zr = Oa('STATUS', !0),
              Jr = Oa('PROCESSLIST', !0),
              rt = Oa('PROCEDURE', !0),
              tt = Oa('FUNCTION', !0),
              et = Oa('BINLOG', !0),
              nt = Oa('EVENTS', !0),
              ot = Oa('COLLATION', !0),
              st = Oa('DATABASES', !0),
              ut = Oa('COLUMNS', !0),
              at = Oa('INDEXES', !0),
              it = Oa('EVENT', !0),
              ct = Oa('GRANTS', !0),
              lt = Oa('VIEW', !0),
              ft = Oa('GRANT', !0),
              bt = Oa('OPTION', !0),
              pt = function (r) {
                return { type: 'origin', value: Array.isArray(r) ? r[0] : r };
              },
              vt = Oa('ROUTINE', !0),
              dt = Oa('EXECUTE', !0),
              yt = function (r, t) {
                return Tb(r, t);
              },
              wt = Oa('ADMIN', !0),
              Lt = Oa('GRANT', !1),
              Ct = Oa('PROXY', !1),
              ht = Oa('(', !1),
              mt = Oa(')', !1),
              Et = /^[0-9]/,
              At = xa([['0', '9']], !1, !1),
              Tt = Oa('IN', !0),
              It = Oa('SHARE', !0),
              _t = Oa('MODE', !0),
              St = Oa('WAIT', !0),
              Nt = Oa('NOWAIT', !0),
              gt = Oa('SKIP', !0),
              Rt = Oa('LOCKED', !0),
              Ot = Oa('NATURAL', !0),
              xt = Oa('LANGUAGE', !0),
              jt = Oa('WITH', !0),
              kt = Oa('QUERY', !0),
              Ut = Oa('EXPANSION', !0),
              Mt = Oa('BOOLEAN', !0),
              Dt = Oa('MATCH', !0),
              Pt = Oa('AGAINST', !1),
              Gt = Oa('OUTFILE', !0),
              Ft = Oa('DUMPFILE', !0),
              $t = Oa('BTREE', !0),
              Ht = Oa('HASH', !0),
              Yt = Oa('PARSER', !0),
              Bt = Oa('VISIBLE', !0),
              Wt = Oa('INVISIBLE', !0),
              Vt = function (r, t) {
                return (
                  t.unshift(r),
                  t.forEach((r) => {
                    const { table: t, as: e } = r;
                    ((Ob[t] = t),
                      e && (Ob[e] = t),
                      (function (r) {
                        const t = Sb(r);
                        (r.clear(), t.forEach((t) => r.add(t)));
                      })(Rb));
                  }),
                  t
                );
              },
              qt = /^[_0-9]/,
              Xt = xa(['_', ['0', '9']], !1, !1),
              Kt = Oa('?', !1),
              Qt = Oa('=', !1),
              Zt = Oa('DUPLICATE', !0),
              zt = function (r, t) {
                return Ib(r, t);
              },
              Jt = function (r) {
                return r[0] + ' ' + r[2];
              },
              re = Oa('>=', !1),
              te = Oa('>', !1),
              ee = Oa('<=', !1),
              ne = Oa('<>', !1),
              oe = Oa('<', !1),
              se = Oa('!=', !1),
              ue = Oa('ESCAPE', !0),
              ae = Oa('+', !1),
              ie = Oa('-', !1),
              ce = Oa('*', !1),
              le = Oa('/', !1),
              fe = Oa('%', !1),
              be = Oa('||', !1),
              pe = Oa('div', !0),
              ve = Oa('&', !1),
              de = Oa('>>', !1),
              ye = Oa('<<', !1),
              we = Oa('^', !1),
              Le = Oa('|', !1),
              Ce = Oa('!', !1),
              he = Oa('~', !1),
              me = function (r) {
                return !0 === hb[r.toUpperCase()];
              },
              Ee = Oa('"', !1),
              Ae = /^[^"]/,
              Te = xa(['"'], !0, !1),
              Ie = function (r) {
                return r.join('');
              },
              _e = /^[^']/,
              Se = xa(["'"], !0, !1),
              Ne = Oa('`', !1),
              ge = /^[^`\\]/,
              Re = xa(['`', '\\'], !0, !1),
              Oe = function (r, t) {
                return r + t.join('');
              },
              xe = /^[A-Za-z_]/,
              je = xa([['A', 'Z'], ['a', 'z'], '_'], !1, !1),
              ke = /^[A-Za-z0-9_$\x80-\uFFFF]/,
              Ue = xa(
                [['A', 'Z'], ['a', 'z'], ['0', '9'], '_', '$', ['', '￿']],
                !1,
                !1
              ),
              Me = /^[A-Za-z0-9_:]/,
              De = xa([['A', 'Z'], ['a', 'z'], ['0', '9'], '_', ':'], !1, !1),
              Pe = Oa(':', !1),
              Ge = Oa('NOW', !0),
              Fe = Oa('OVER', !0),
              $e = Oa('WINDOW', !0),
              He = Oa('FOLLOWING', !0),
              Ye = Oa('PRECEDING', !0),
              Be = Oa('CURRENT', !0),
              We = Oa('UNBOUNDED', !0),
              Ve = Oa('SEPARATOR', !0),
              qe = Oa('YEAR_MONTH', !0),
              Xe = Oa('DAY_HOUR', !0),
              Ke = Oa('DAY_MINUTE', !0),
              Qe = Oa('DAY_SECOND', !0),
              Ze = Oa('DAY_MICROSECOND', !0),
              ze = Oa('HOUR_MINUTE', !0),
              Je = Oa('HOUR_SECOND', !0),
              rn = Oa('HOUR_MICROSECOND', !0),
              tn = Oa('MINUTE_SECOND', !0),
              en = Oa('MINUTE_MICROSECOND', !0),
              nn = Oa('SECOND_MICROSECOND', !0),
              on = Oa('TIMEZONE_HOUR', !0),
              sn = Oa('TIMEZONE_MINUTE', !0),
              un = Oa('CENTURY', !0),
              an = Oa('DAY', !0),
              cn = Oa('DATE', !0),
              ln = Oa('DECADE', !0),
              fn = Oa('DOW', !0),
              bn = Oa('DOY', !0),
              pn = Oa('EPOCH', !0),
              vn = Oa('HOUR', !0),
              dn = Oa('ISODOW', !0),
              yn = Oa('ISOWEEK', !0),
              wn = Oa('ISOYEAR', !0),
              Ln = Oa('MICROSECONDS', !0),
              Cn = Oa('MILLENNIUM', !0),
              hn = Oa('MILLISECONDS', !0),
              mn = Oa('MINUTE', !0),
              En = Oa('MONTH', !0),
              An = Oa('QUARTER', !0),
              Tn = Oa('SECOND', !0),
              In = Oa('TIME', !0),
              _n = Oa('TIMEZONE', !0),
              Sn = Oa('WEEK', !0),
              Nn = Oa('YEAR', !0),
              gn = Oa('DATE_TRUNC', !0),
              Rn = Oa('BOTH', !0),
              On = Oa('LEADING', !0),
              xn = Oa('TRAILING', !0),
              jn = Oa('trim', !0),
              kn = Oa('convert', !0),
              Un = Oa('binary', !0),
              Mn = Oa('_binary', !0),
              Dn = Oa('_latin1', !0),
              Pn = Oa('X', !0),
              Gn = /^[0-9A-Fa-f]/,
              Fn = xa(
                [
                  ['0', '9'],
                  ['A', 'F'],
                  ['a', 'f'],
                ],
                !1,
                !1
              ),
              $n = Oa('b', !0),
              Hn = Oa('0x', !0),
              Yn = Oa('N', !0),
              Bn = function (r, t) {
                return { type: r.toLowerCase(), value: t[1].join('') };
              },
              Wn = /^[^"\\\0-\x1F\x7F]/,
              Vn = xa(['"', '\\', ['\0', ''], ''], !0, !1),
              qn = /^[^'\\]/,
              Xn = xa(["'", '\\'], !0, !1),
              Kn = Oa("\\'", !1),
              Qn = Oa('\\"', !1),
              Zn = Oa('\\\\', !1),
              zn = Oa('\\/', !1),
              Jn = Oa('\\b', !1),
              ro = Oa('\\f', !1),
              to = Oa('\\n', !1),
              eo = Oa('\\r', !1),
              no = Oa('\\t', !1),
              oo = Oa('\\u', !1),
              so = Oa('\\', !1),
              uo = Oa("''", !1),
              ao = Oa('""', !1),
              io = Oa('``', !1),
              co = /^[\n\r]/,
              lo = xa(['\n', '\r'], !1, !1),
              fo = Oa('.', !1),
              bo = /^[0-9a-fA-F]/,
              po = xa(
                [
                  ['0', '9'],
                  ['a', 'f'],
                  ['A', 'F'],
                ],
                !1,
                !1
              ),
              vo = /^[eE]/,
              yo = xa(['e', 'E'], !1, !1),
              wo = /^[+\-]/,
              Lo = xa(['+', '-'], !1, !1),
              Co = Oa('NULL', !0),
              ho = Oa('NOT NULL', !0),
              mo = Oa('TRUE', !0),
              Eo = Oa('TO', !0),
              Ao = Oa('FALSE', !0),
              To = Oa('SHOW', !0),
              Io = Oa('DROP', !0),
              _o = Oa('USE', !0),
              So = Oa('ALTER', !0),
              No = Oa('SELECT', !0),
              go = Oa('UPDATE', !0),
              Ro = Oa('CREATE', !0),
              Oo = Oa('TEMPORARY', !0),
              xo = Oa('DELETE', !0),
              jo = Oa('INSERT', !0),
              ko = Oa('RECURSIVE', !1),
              Uo = Oa('REPLACE', !0),
              Mo = Oa('RENAME', !0),
              Do = Oa('IGNORE', !0),
              Po = (Oa('EXPLAIN', !0), Oa('PARTITION', !0)),
              Go = Oa('INTO', !0),
              Fo = Oa('FROM', !0),
              $o = Oa('UNLOCK', !0),
              Ho = Oa('TABLE', !0),
              Yo = Oa('TRIGGER', !0),
              Bo = Oa('TABLES', !0),
              Wo = Oa('DATABASE', !0),
              Vo = Oa('SCHEMA', !0),
              qo = Oa('ON', !0),
              Xo = Oa('LEFT', !0),
              Ko = Oa('RIGHT', !0),
              Qo = Oa('FULL', !0),
              Zo = Oa('INNER', !0),
              zo = Oa('CROSS', !0),
              Jo = Oa('JOIN', !0),
              rs = Oa('OUTER', !0),
              ts = Oa('UNION', !0),
              es = Oa('MINUS', !0),
              ns = Oa('INTERSECT', !0),
              os = Oa('VALUES', !0),
              ss = Oa('USING', !0),
              us = Oa('WHERE', !0),
              as = Oa('GO', !0),
              is = Oa('GROUP', !0),
              cs = Oa('BY', !0),
              ls = Oa('ORDER', !0),
              fs = Oa('HAVING', !0),
              bs = Oa('LIMIT', !0),
              ps = Oa('OFFSET', !0),
              vs = Oa('ASC', !0),
              ds = Oa('DESC', !0),
              ys = Oa('DESCRIBE', !0),
              ws = Oa('ALL', !0),
              Ls = Oa('DISTINCT', !0),
              Cs = Oa('BETWEEN', !0),
              hs = Oa('IS', !0),
              ms = Oa('LIKE', !0),
              Es = Oa('RLIKE', !0),
              As = Oa('REGEXP', !0),
              Ts = Oa('EXISTS', !0),
              Is = Oa('AND', !0),
              _s = Oa('OR', !0),
              Ss = Oa('COUNT', !0),
              Ns = Oa('GROUP_CONCAT', !0),
              gs = Oa('MAX', !0),
              Rs = Oa('MIN', !0),
              Os = Oa('SUM', !0),
              xs = Oa('AVG', !0),
              js = Oa('EXTRACT', !0),
              ks = Oa('CALL', !0),
              Us = Oa('CASE', !0),
              Ms = Oa('WHEN', !0),
              Ds = Oa('THEN', !0),
              Ps = Oa('ELSE', !0),
              Gs = Oa('END', !0),
              Fs = Oa('CAST', !0),
              $s = Oa('VARBINARY', !0),
              Hs = Oa('BIT', !0),
              Ys = Oa('CHAR', !0),
              Bs = Oa('VARCHAR', !0),
              Ws = Oa('NUMERIC', !0),
              Vs = Oa('DECIMAL', !0),
              qs = Oa('SIGNED', !0),
              Xs = Oa('UNSIGNED', !0),
              Ks = Oa('INT', !0),
              Qs = Oa('ZEROFILL', !0),
              Zs = Oa('INTEGER', !0),
              zs = Oa('JSON', !0),
              Js = Oa('SMALLINT', !0),
              ru = Oa('MEDIUMINT', !0),
              tu = Oa('TINYINT', !0),
              eu = Oa('TINYTEXT', !0),
              nu = Oa('TEXT', !0),
              ou = Oa('MEDIUMTEXT', !0),
              su = Oa('LONGTEXT', !0),
              uu = Oa('BIGINT', !0),
              au = Oa('ENUM', !0),
              iu = Oa('FLOAT', !0),
              cu = Oa('DOUBLE', !0),
              lu = Oa('DATETIME', !0),
              fu = Oa('ROWS', !0),
              bu = Oa('TIMESTAMP', !0),
              pu = Oa('TRUNCATE', !0),
              vu = Oa('USER', !0),
              du = Oa('CURRENT_DATE', !0),
              yu = (Oa('ADDDATE', !0), Oa('INTERVAL', !0)),
              wu = Oa('MICROSECOND', !0),
              Lu = Oa('CURRENT_TIME', !0),
              Cu = Oa('CURRENT_TIMESTAMP', !0),
              hu = Oa('CURRENT_USER', !0),
              mu = Oa('SESSION_USER', !0),
              Eu = Oa('SYSTEM_USER', !0),
              Au = Oa('GLOBAL', !0),
              Tu = Oa('SESSION', !0),
              Iu = Oa('PERSIST', !0),
              _u = Oa('PERSIST_ONLY', !0),
              Su = Oa('GEOMETRY', !0),
              Nu = Oa('POINT', !0),
              gu = Oa('LINESTRING', !0),
              Ru = Oa('POLYGON', !0),
              Ou = Oa('MULTIPOINT', !0),
              xu = Oa('MULTILINESTRING', !0),
              ju = Oa('MULTIPOLYGON', !0),
              ku = Oa('GEOMETRYCOLLECTION', !0),
              Uu = Oa('@@', !1),
              Mu = Oa('$', !1),
              Du = Oa('return', !0),
              Pu = Oa(':=', !1),
              Gu = Oa('DUAL', !0),
              Fu = Oa('ADD', !0),
              $u = Oa('COLUMN', !0),
              Hu = Oa('INDEX', !0),
              Yu = Oa('MODIFY', !0),
              Bu = Oa('FULLTEXT', !0),
              Wu = Oa('SPATIAL', !0),
              Vu = Oa('COMMENT', !0),
              qu = Oa('CONSTRAINT', !0),
              Xu = Oa('REFERENCES', !0),
              Ku = Oa('SQL_CALC_FOUND_ROWS', !0),
              Qu = Oa('SQL_CACHE', !0),
              Zu = Oa('SQL_NO_CACHE', !0),
              zu = Oa('SQL_SMALL_RESULT', !0),
              Ju = Oa('SQL_BIG_RESULT', !0),
              ra = Oa('SQL_BUFFER_RESULT', !0),
              ta = Oa(',', !1),
              ea = Oa('[', !1),
              na = Oa(']', !1),
              oa = Oa(';', !1),
              sa = Oa('->', !1),
              ua = Oa('->>', !1),
              aa = Oa('&&', !1),
              ia = Oa('XOR', !0),
              ca = Oa('/*', !1),
              la = Oa('*/', !1),
              fa = Oa('--', !1),
              ba = Oa('#', !1),
              pa = { type: 'any' },
              va = /^[ \t\n\r]/,
              da = xa([' ', '\t', '\n', '\r'], !1, !1),
              ya = function (r, t, e) {
                return { type: 'assign', left: r, symbol: t, right: e };
              },
              wa = Oa('boolean', !0),
              La = Oa('blob', !0),
              Ca = Oa('tinyblob', !0),
              ha = Oa('mediumblob', !0),
              ma = Oa('longblob', !0),
              Ea = function (r) {
                return { dataType: r };
              },
              Aa = /^[0-6]/,
              Ta = xa([['0', '6']], !1, !1),
              Ia = function (r) {
                return { dataType: r };
              },
              _a = 0,
              Sa = [{ line: 1, column: 1 }],
              Na = 0,
              ga = [],
              Ra = 0;
            if ('startRule' in t) {
              if (!(t.startRule in u))
                throw new Error(
                  'Can\'t start parsing from rule "' + t.startRule + '".'
                );
              a = u[t.startRule];
            }
            function Oa(r, t) {
              return { type: 'literal', text: r, ignoreCase: t };
            }
            function xa(r, t, e) {
              return { type: 'class', parts: r, inverted: t, ignoreCase: e };
            }
            function ja(t) {
              var e,
                n = Sa[t];
              if (n) return n;
              for (e = t - 1; !Sa[e]; ) e--;
              for (n = { line: (n = Sa[e]).line, column: n.column }; e < t; )
                (10 === r.charCodeAt(e)
                  ? (n.line++, (n.column = 1))
                  : n.column++,
                  e++);
              return ((Sa[t] = n), n);
            }
            function ka(r, t) {
              var e = ja(r),
                n = ja(t);
              return {
                start: { offset: r, line: e.line, column: e.column },
                end: { offset: t, line: n.line, column: n.column },
              };
            }
            function Ua(r) {
              _a < Na || (_a > Na && ((Na = _a), (ga = [])), ga.push(r));
            }
            function Ma(r, t, e) {
              return new o(o.buildMessage(r, t), r, t, e);
            }
            function Da() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = Pa()) !== s))
                if (Zf() !== s) {
                  for (
                    e = [],
                      n = _a,
                      (o = Zf()) !== s &&
                      (u = Gl()) !== s &&
                      (a = Zf()) !== s &&
                      (i = Pa()) !== s
                        ? (n = o = [o, u, a, i])
                        : ((_a = n), (n = s));
                    n !== s;

                  )
                    (e.push(n),
                      (n = _a),
                      (o = Zf()) !== s &&
                      (u = Gl()) !== s &&
                      (a = Zf()) !== s &&
                      (i = Pa()) !== s
                        ? (n = o = [o, u, a, i])
                        : ((_a = n), (n = s)));
                  e !== s
                    ? (r,
                      (r = t =
                        (function (r, t) {
                          if (!t || 0 === t.length) return r;
                          (delete r.tableList, delete r.columnList);
                          let e = r;
                          for (let r = 0; r < t.length; r++)
                            (delete t[r][3].tableList,
                              delete t[r][3].columnList,
                              (e.go_next = t[r][3]),
                              (e.go = 'go'),
                              (e = e.go_next));
                          return {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: r,
                          };
                        })(t, e)))
                    : ((_a = r), (r = s));
                } else ((_a = r), (r = s));
              else ((_a = r), (r = s));
              return r;
            }
            function Pa() {
              var r, t;
              return (
                (r = _a),
                Zf() !== s &&
                (t = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = Fa()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s &&
                        (u = qf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = Fa()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s &&
                        (u = qf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = Fa()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)));
                    e !== s
                      ? (r,
                        (t = (function (r, t) {
                          const e = (r && r.ast) || r,
                            n = t && t.length && t[0].length >= 4 ? [e] : e;
                          for (let r = 0; r < t.length; r++)
                            t[r][3] &&
                              0 !== t[r][3].length &&
                              n.push((t[r][3] && t[r][3].ast) || t[r][3]);
                          return {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: n,
                          };
                        })(t, e)),
                        (r = t))
                      : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Ga() {
              var t;
              return (
                (t = (function () {
                  var r, t, e, n, o, u, a;
                  ((r = _a),
                    (t = bl()) !== s &&
                    Zf() !== s &&
                    (e = Nl()) !== s &&
                    Zf() !== s
                      ? ((n = Qa()) === s && (n = null),
                        n !== s && Zf() !== s && (o = Ui()) !== s
                          ? (r,
                            (i = t),
                            (l = e),
                            (f = n),
                            (b = o) &&
                              b.forEach((r) =>
                                gb.add(`${i}::${r.db}::${r.table}`)
                              ),
                            (t = {
                              tableList: Array.from(gb),
                              columnList: Sb(Rb),
                              ast: {
                                type: i.toLowerCase(),
                                keyword: l.toLowerCase(),
                                prefix: f,
                                name: b,
                              },
                            }),
                            (r = t))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)));
                  var i, l, f, b;
                  r === s &&
                    ((r = _a),
                    (t = bl()) !== s &&
                    Zf() !== s &&
                    (e = Sf()) !== s &&
                    Zf() !== s
                      ? ((n = Qa()) === s && (n = null),
                        n !== s && Zf() !== s && (o = Ui()) !== s && Zf() !== s
                          ? ((u = ui()) === s && (u = null),
                            u !== s
                              ? (r,
                                (t = (function (r, t, e, n, o) {
                                  return {
                                    tableList: Array.from(gb),
                                    columnList: Sb(Rb),
                                    ast: {
                                      type: r.toLowerCase(),
                                      keyword: t.toLowerCase(),
                                      prefix: e,
                                      name: n,
                                      options: [{ type: 'origin', value: o }],
                                    },
                                  };
                                })(t, e, n, o, u)),
                                (r = t))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)),
                    r === s &&
                      ((r = _a),
                      (t = bl()) !== s &&
                      Zf() !== s &&
                      (e = kf()) !== s &&
                      Zf() !== s &&
                      (n = Tc()) !== s &&
                      Zf() !== s &&
                      (o = jl()) !== s &&
                      Zf() !== s &&
                      (u = Gi()) !== s &&
                      Zf() !== s
                        ? ((a = (function () {
                            var r, t, e, n, o, u;
                            ((r = _a), (t = za()) === s && (t = Ja()));
                            if (t !== s) {
                              for (
                                e = [],
                                  n = _a,
                                  (o = Zf()) !== s
                                    ? ((u = za()) === s && (u = Ja()),
                                      u !== s
                                        ? (n = o = [o, u])
                                        : ((_a = n), (n = s)))
                                    : ((_a = n), (n = s));
                                n !== s;

                              )
                                (e.push(n),
                                  (n = _a),
                                  (o = Zf()) !== s
                                    ? ((u = za()) === s && (u = Ja()),
                                      u !== s
                                        ? (n = o = [o, u])
                                        : ((_a = n), (n = s)))
                                    : ((_a = n), (n = s)));
                              e !== s
                                ? (r, (t = c(t, e)), (r = t))
                                : ((_a = r), (r = s));
                            } else ((_a = r), (r = s));
                            return r;
                          })()) === s && (a = null),
                          a !== s && Zf() !== s
                            ? (r,
                              (t = (function (r, t, e, n, o) {
                                return {
                                  tableList: Array.from(gb),
                                  columnList: Sb(Rb),
                                  ast: {
                                    type: r.toLowerCase(),
                                    keyword: t.toLowerCase(),
                                    name: e,
                                    table: n,
                                    options: o,
                                  },
                                };
                              })(t, e, n, u, a)),
                              (r = t))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)),
                      r === s &&
                        ((r = _a),
                        (t = bl()) !== s && Zf() !== s
                          ? ((e = Ol()) === s && (e = xl()),
                            e !== s && Zf() !== s
                              ? ((n = Qa()) === s && (n = null),
                                n !== s && Zf() !== s && (o = xc()) !== s
                                  ? (r,
                                    (t = (function (r, t, e, n) {
                                      return {
                                        tableList: Array.from(gb),
                                        columnList: Sb(Rb),
                                        ast: {
                                          type: r.toLowerCase(),
                                          keyword: t.toLowerCase(),
                                          prefix: e,
                                          name: n,
                                        },
                                      };
                                    })(t, e, n, o)),
                                    (r = t))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)),
                        r === s &&
                          ((r = _a),
                          (t = bl()) !== s &&
                          Zf() !== s &&
                          (e = gl()) !== s &&
                          Zf() !== s
                            ? ((n = Qa()) === s && (n = null),
                              n !== s && Zf() !== s && (o = Di()) !== s
                                ? (r,
                                  (t = (function (r, t, e, n) {
                                    return {
                                      tableList: Array.from(gb),
                                      columnList: Sb(Rb),
                                      ast: {
                                        type: r.toLowerCase(),
                                        keyword: t.toLowerCase(),
                                        prefix: e,
                                        name: [
                                          { schema: n.db, trigger: n.table },
                                        ],
                                      },
                                    };
                                  })(t, e, n, o)),
                                  (r = t))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s))))));
                  return r;
                })()) === s &&
                  (t = (function () {
                    var t;
                    (t = (function () {
                      var r, t, e, n, o, u, a, c, l, f;
                      ((r = _a),
                        (t = yl()) !== s && Zf() !== s
                          ? ((e = wl()) === s && (e = null),
                            e !== s && Zf() !== s && Nl() !== s && Zf() !== s
                              ? ((n = Ba()) === s && (n = null),
                                n !== s &&
                                Zf() !== s &&
                                (o = Gi()) !== s &&
                                Zf() !== s &&
                                (u = (function r() {
                                  var t, e;
                                  (t = (function () {
                                    var r, t;
                                    ((r = _a),
                                      Xl() !== s &&
                                      Zf() !== s &&
                                      (t = Ui()) !== s
                                        ? (r, (r = { type: 'like', table: t }))
                                        : ((_a = r), (r = s)));
                                    return r;
                                  })()) === s &&
                                    ((t = _a),
                                    Wf() !== s &&
                                    Zf() !== s &&
                                    (e = r()) !== s &&
                                    Zf() !== s &&
                                    Vf() !== s
                                      ? (t, ((n = e).parentheses = !0), (t = n))
                                      : ((_a = t), (t = s)));
                                  var n;
                                  return t;
                                })()) !== s
                                  ? (r,
                                    (b = t),
                                    (p = e),
                                    (v = n),
                                    (y = u),
                                    (d = o) &&
                                      gb.add(`create::${d.db}::${d.table}`),
                                    (t = {
                                      tableList: Array.from(gb),
                                      columnList: Sb(Rb),
                                      ast: {
                                        type: b[0].toLowerCase(),
                                        keyword: 'table',
                                        temporary: p && p[0].toLowerCase(),
                                        if_not_exists: v,
                                        table: [d],
                                        like: y,
                                      },
                                    }),
                                    (r = t))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)));
                      var b, p, v, d, y;
                      r === s &&
                        ((r = _a),
                        (t = yl()) !== s && Zf() !== s
                          ? ((e = wl()) === s && (e = null),
                            e !== s && Zf() !== s && Nl() !== s && Zf() !== s
                              ? ((n = Ba()) === s && (n = null),
                                n !== s &&
                                Zf() !== s &&
                                (o = Gi()) !== s &&
                                Zf() !== s
                                  ? ((u = (function () {
                                      var r, t, e, n, o, u, a, i, c;
                                      if (((r = _a), (t = Wf()) !== s))
                                        if (Zf() !== s)
                                          if ((e = Wa()) !== s) {
                                            for (
                                              n = [],
                                                o = _a,
                                                (u = Zf()) !== s &&
                                                (a = Yf()) !== s &&
                                                (i = Zf()) !== s &&
                                                (c = Wa()) !== s
                                                  ? (o = u = [u, a, i, c])
                                                  : ((_a = o), (o = s));
                                              o !== s;

                                            )
                                              (n.push(o),
                                                (o = _a),
                                                (u = Zf()) !== s &&
                                                (a = Yf()) !== s &&
                                                (i = Zf()) !== s &&
                                                (c = Wa()) !== s
                                                  ? (o = u = [u, a, i, c])
                                                  : ((_a = o), (o = s)));
                                            n !== s &&
                                            (o = Zf()) !== s &&
                                            (u = Vf()) !== s
                                              ? (r, (t = A(e, n)), (r = t))
                                              : ((_a = r), (r = s));
                                          } else ((_a = r), (r = s));
                                        else ((_a = r), (r = s));
                                      else ((_a = r), (r = s));
                                      return r;
                                    })()) === s && (u = null),
                                    u !== s && Zf() !== s
                                      ? ((a = (function () {
                                          var r, t, e, n, o, u, a, c;
                                          if (((r = _a), (t = ci()) !== s)) {
                                            for (
                                              e = [],
                                                n = _a,
                                                (o = Zf()) !== s
                                                  ? ((u = Yf()) === s &&
                                                      (u = null),
                                                    u !== s &&
                                                    (a = Zf()) !== s &&
                                                    (c = ci()) !== s
                                                      ? (n = o = [o, u, a, c])
                                                      : ((_a = n), (n = s)))
                                                  : ((_a = n), (n = s));
                                              n !== s;

                                            )
                                              (e.push(n),
                                                (n = _a),
                                                (o = Zf()) !== s
                                                  ? ((u = Yf()) === s &&
                                                      (u = null),
                                                    u !== s &&
                                                    (a = Zf()) !== s &&
                                                    (c = ci()) !== s
                                                      ? (n = o = [o, u, a, c])
                                                      : ((_a = n), (n = s)))
                                                  : ((_a = n), (n = s)));
                                            e !== s
                                              ? (r, (t = i(t, e)), (r = t))
                                              : ((_a = r), (r = s));
                                          } else ((_a = r), (r = s));
                                          return r;
                                        })()) === s && (a = null),
                                        a !== s && Zf() !== s
                                          ? ((c = El()) === s && (c = hl()),
                                            c === s && (c = null),
                                            c !== s && Zf() !== s
                                              ? ((l = Sl()) === s && (l = null),
                                                l !== s && Zf() !== s
                                                  ? ((f = Ha()) === s &&
                                                      (f = null),
                                                    f !== s
                                                      ? (r,
                                                        (t = (function (
                                                          r,
                                                          t,
                                                          e,
                                                          n,
                                                          o,
                                                          s,
                                                          u,
                                                          a,
                                                          i
                                                        ) {
                                                          return (
                                                            n &&
                                                              gb.add(
                                                                `create::${n.db}::${n.table}`
                                                              ),
                                                            {
                                                              tableList:
                                                                Array.from(gb),
                                                              columnList:
                                                                Sb(Rb),
                                                              ast: {
                                                                type: r[0].toLowerCase(),
                                                                keyword:
                                                                  'table',
                                                                temporary:
                                                                  t &&
                                                                  t[0].toLowerCase(),
                                                                if_not_exists:
                                                                  e,
                                                                table: [n],
                                                                ignore_replace:
                                                                  u &&
                                                                  u[0].toLowerCase(),
                                                                as:
                                                                  a &&
                                                                  a[0].toLowerCase(),
                                                                query_expr:
                                                                  i && i.ast,
                                                                create_definitions:
                                                                  o,
                                                                table_options:
                                                                  s,
                                                              },
                                                            }
                                                          );
                                                        })(
                                                          t,
                                                          e,
                                                          n,
                                                          o,
                                                          u,
                                                          a,
                                                          c,
                                                          l,
                                                          f
                                                        )),
                                                        (r = t))
                                                      : ((_a = r), (r = s)))
                                                  : ((_a = r), (r = s)))
                                              : ((_a = r), (r = s)))
                                          : ((_a = r), (r = s)))
                                      : ((_a = r), (r = s)))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)));
                      return r;
                    })()) === s &&
                      (t = (function () {
                        var t, e, n, o, u, a, i, c, l, f, b;
                        ((t = _a),
                          (e = yl()) !== s && Zf() !== s
                            ? ((n = Xa()) === s && (n = null),
                              n !== s && Zf() !== s && gl() !== s && Zf() !== s
                                ? ((o = Ba()) === s && (o = null),
                                  o !== s &&
                                  Zf() !== s &&
                                  (u = Gi()) !== s &&
                                  Zf() !== s &&
                                  (a = (function () {
                                    var t;
                                    'before' === r.substr(_a, 6).toLowerCase()
                                      ? ((t = r.substr(_a, 6)), (_a += 6))
                                      : ((t = s), 0 === Ra && Ua(g));
                                    t === s &&
                                      ('after' === r.substr(_a, 5).toLowerCase()
                                        ? ((t = r.substr(_a, 5)), (_a += 5))
                                        : ((t = s), 0 === Ra && Ua(R)));
                                    return t;
                                  })()) !== s &&
                                  Zf() !== s &&
                                  (i = (function () {
                                    var r, t;
                                    ((r = _a),
                                      (t = Cl()) === s &&
                                        (t = dl()) === s &&
                                        (t = Ll()));
                                    t !== s &&
                                      (r,
                                      (t = { keyword: t[0].toLowerCase() }));
                                    return (r = t);
                                  })()) !== s &&
                                  Zf() !== s &&
                                  jl() !== s &&
                                  Zf() !== s &&
                                  (c = Gi()) !== s &&
                                  Zf() !== s &&
                                  (l = (function () {
                                    var t, e, n, o;
                                    ((t = _a),
                                      'for' === r.substr(_a, 3).toLowerCase()
                                        ? ((e = r.substr(_a, 3)), (_a += 3))
                                        : ((e = s), 0 === Ra && Ua(O)));
                                    e !== s && Zf() !== s
                                      ? ('each' ===
                                        r.substr(_a, 4).toLowerCase()
                                          ? ((n = r.substr(_a, 4)), (_a += 4))
                                          : ((n = s), 0 === Ra && Ua(x)),
                                        n === s && (n = null),
                                        n !== s && Zf() !== s
                                          ? ('row' ===
                                            r.substr(_a, 3).toLowerCase()
                                              ? ((o = r.substr(_a, 3)),
                                                (_a += 3))
                                              : ((o = s), 0 === Ra && Ua(j)),
                                            o === s &&
                                              ('statement' ===
                                              r.substr(_a, 9).toLowerCase()
                                                ? ((o = r.substr(_a, 9)),
                                                  (_a += 9))
                                                : ((o = s), 0 === Ra && Ua(k))),
                                            o !== s
                                              ? (t,
                                                (u = e),
                                                (i = o),
                                                (e = {
                                                  keyword: (a = n)
                                                    ? `${u.toLowerCase()} ${a.toLowerCase()}`
                                                    : u.toLowerCase(),
                                                  args: i.toLowerCase(),
                                                }),
                                                (t = e))
                                              : ((_a = t), (t = s)))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s));
                                    var u, a, i;
                                    return t;
                                  })()) !== s &&
                                  Zf() !== s
                                    ? ((f = (function () {
                                        var t, e, n;
                                        ((t = _a),
                                          'follows' ===
                                          r.substr(_a, 7).toLowerCase()
                                            ? ((e = r.substr(_a, 7)), (_a += 7))
                                            : ((e = s), 0 === Ra && Ua(U)));
                                        e === s &&
                                          ('precedes' ===
                                          r.substr(_a, 8).toLowerCase()
                                            ? ((e = r.substr(_a, 8)), (_a += 8))
                                            : ((e = s), 0 === Ra && Ua(M)));
                                        e !== s &&
                                        Zf() !== s &&
                                        (n = _c()) !== s
                                          ? (t,
                                            (t = e =
                                              { keyword: e, trigger: n }))
                                          : ((_a = t), (t = s));
                                        return t;
                                      })()) === s && (f = null),
                                      f !== s &&
                                      Zf() !== s &&
                                      (b = (function () {
                                        var r, t;
                                        ((r = _a),
                                          _l() !== s &&
                                          Zf() !== s &&
                                          (t = Xi()) !== s
                                            ? (r,
                                              (r = { type: 'set', expr: t }))
                                            : ((_a = r), (r = s)));
                                        return r;
                                      })()) !== s
                                        ? (t,
                                          (p = e),
                                          (v = n),
                                          (d = o),
                                          (y = u),
                                          (w = a),
                                          (L = i),
                                          (C = c),
                                          (h = l),
                                          (m = f),
                                          (E = b),
                                          (e = {
                                            tableList: Array.from(gb),
                                            columnList: Sb(Rb),
                                            ast: {
                                              type: p[0].toLowerCase(),
                                              definer: v,
                                              keyword: 'trigger',
                                              for_each: h,
                                              if_not_exists: d,
                                              trigger: y,
                                              time: w,
                                              events: [L],
                                              order: m,
                                              table: C,
                                              execute: E,
                                            },
                                          }),
                                          (t = e))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)));
                        var p, v, d, y, w, L, C, h, m, E;
                        return t;
                      })()) === s &&
                      (t = (function () {
                        var r, t, e, n, o, u, a, c, l, f, b, p;
                        ((r = _a),
                          (t = yl()) !== s && Zf() !== s
                            ? ((e = Pf()) === s &&
                                (e = Mf()) === s &&
                                (e = Df()),
                              e === s && (e = null),
                              e !== s &&
                              Zf() !== s &&
                              (n = kf()) !== s &&
                              Zf() !== s &&
                              (o = _c()) !== s &&
                              Zf() !== s
                                ? ((u = xi()) === s && (u = null),
                                  u !== s &&
                                  Zf() !== s &&
                                  (a = jl()) !== s &&
                                  Zf() !== s &&
                                  (c = Gi()) !== s &&
                                  Zf() !== s &&
                                  Wf() !== s &&
                                  Zf() !== s &&
                                  (l = (function () {
                                    var r, t, e, n, o, u, a, c;
                                    if (((r = _a), (t = Ya()) !== s)) {
                                      for (
                                        e = [],
                                          n = _a,
                                          (o = Zf()) !== s &&
                                          (u = Yf()) !== s &&
                                          (a = Zf()) !== s &&
                                          (c = Ya()) !== s
                                            ? (n = o = [o, u, a, c])
                                            : ((_a = n), (n = s));
                                        n !== s;

                                      )
                                        (e.push(n),
                                          (n = _a),
                                          (o = Zf()) !== s &&
                                          (u = Yf()) !== s &&
                                          (a = Zf()) !== s &&
                                          (c = Ya()) !== s
                                            ? (n = o = [o, u, a, c])
                                            : ((_a = n), (n = s)));
                                      e !== s
                                        ? (r, (t = i(t, e)), (r = t))
                                        : ((_a = r), (r = s));
                                    } else ((_a = r), (r = s));
                                    return r;
                                  })()) !== s &&
                                  Zf() !== s &&
                                  Vf() !== s &&
                                  Zf() !== s
                                    ? ((f = ji()) === s && (f = null),
                                      f !== s && Zf() !== s
                                        ? ((b = za()) === s && (b = null),
                                          b !== s && Zf() !== s
                                            ? ((p = Ja()) === s && (p = null),
                                              p !== s && Zf() !== s
                                                ? (r,
                                                  (v = t),
                                                  (d = e),
                                                  (y = n),
                                                  (w = o),
                                                  (L = u),
                                                  (C = a),
                                                  (h = c),
                                                  (m = l),
                                                  (E = f),
                                                  (A = b),
                                                  (T = p),
                                                  (t = {
                                                    tableList: Array.from(gb),
                                                    columnList: Sb(Rb),
                                                    ast: {
                                                      type: v[0].toLowerCase(),
                                                      index_type:
                                                        d && d.toLowerCase(),
                                                      keyword: y.toLowerCase(),
                                                      index: w,
                                                      on_kw: C[0].toLowerCase(),
                                                      table: h,
                                                      index_columns: m,
                                                      index_using: L,
                                                      index_options: E,
                                                      algorithm_option: A,
                                                      lock_option: T,
                                                    },
                                                  }),
                                                  (r = t))
                                                : ((_a = r), (r = s)))
                                            : ((_a = r), (r = s)))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)));
                        var v, d, y, w, L, C, h, m, E, A, T;
                        return r;
                      })()) === s &&
                      (t = (function () {
                        var r, t, e, n, o, u;
                        ((r = _a),
                          (t = yl()) !== s && Zf() !== s
                            ? ((e = Ol()) === s && (e = xl()),
                              e !== s && Zf() !== s
                                ? ((n = Ba()) === s && (n = null),
                                  n !== s &&
                                  Zf() !== s &&
                                  (o = xc()) !== s &&
                                  Zf() !== s
                                    ? ((u = (function () {
                                        var r, t, e, n, o, u;
                                        if (((r = _a), (t = ii()) !== s)) {
                                          for (
                                            e = [],
                                              n = _a,
                                              (o = Zf()) !== s &&
                                              (u = ii()) !== s
                                                ? (n = o = [o, u])
                                                : ((_a = n), (n = s));
                                            n !== s;

                                          )
                                            (e.push(n),
                                              (n = _a),
                                              (o = Zf()) !== s &&
                                              (u = ii()) !== s
                                                ? (n = o = [o, u])
                                                : ((_a = n), (n = s)));
                                          e !== s
                                            ? (r, (t = c(t, e)), (r = t))
                                            : ((_a = r), (r = s));
                                        } else ((_a = r), (r = s));
                                        return r;
                                      })()) === s && (u = null),
                                      u !== s
                                        ? (r,
                                          (a = t),
                                          (i = n),
                                          (l = o),
                                          (f = u),
                                          (t = {
                                            tableList: Array.from(gb),
                                            columnList: Sb(Rb),
                                            ast: {
                                              type: a[0].toLowerCase(),
                                              keyword: 'database',
                                              if_not_exists: i,
                                              database: l,
                                              create_definitions: f,
                                            },
                                          }),
                                          (r = t))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)));
                        var a, i, l, f;
                        return r;
                      })()) === s &&
                      (t = (function () {
                        var t,
                          e,
                          n,
                          o,
                          u,
                          a,
                          i,
                          c,
                          l,
                          A,
                          T,
                          I,
                          _,
                          S,
                          N,
                          g,
                          R,
                          O,
                          x,
                          j,
                          k;
                        ((t = _a),
                          (e = yl()) !== s && Zf() !== s
                            ? ((n = _a),
                              (o = zl()) !== s &&
                              (u = Zf()) !== s &&
                              (a = hl()) !== s
                                ? (n = o = [o, u, a])
                                : ((_a = n), (n = s)),
                              n === s && (n = null),
                              n !== s && (o = Zf()) !== s
                                ? ((u = _a),
                                  'algorithm' === r.substr(_a, 9).toLowerCase()
                                    ? ((a = r.substr(_a, 9)), (_a += 9))
                                    : ((a = s), 0 === Ra && Ua(d)),
                                  a !== s &&
                                  (i = Zf()) !== s &&
                                  (c = Of()) !== s &&
                                  (l = Zf()) !== s
                                    ? ('undefined' ===
                                      r.substr(_a, 9).toLowerCase()
                                        ? ((A = r.substr(_a, 9)), (_a += 9))
                                        : ((A = s), 0 === Ra && Ua(y)),
                                      A === s &&
                                        ('merge' ===
                                        r.substr(_a, 5).toLowerCase()
                                          ? ((A = r.substr(_a, 5)), (_a += 5))
                                          : ((A = s), 0 === Ra && Ua(w)),
                                        A === s &&
                                          ('temptable' ===
                                          r.substr(_a, 9).toLowerCase()
                                            ? ((A = r.substr(_a, 9)), (_a += 9))
                                            : ((A = s), 0 === Ra && Ua(L)))),
                                      A !== s
                                        ? (u = a = [a, i, c, l, A])
                                        : ((_a = u), (u = s)))
                                    : ((_a = u), (u = s)),
                                  u === s && (u = null),
                                  u !== s && (a = Zf()) !== s
                                    ? ((i = Xa()) === s && (i = null),
                                      i !== s && (c = Zf()) !== s
                                        ? ((l = _a),
                                          'sql' ===
                                          r.substr(_a, 3).toLowerCase()
                                            ? ((A = r.substr(_a, 3)), (_a += 3))
                                            : ((A = s), 0 === Ra && Ua(C)),
                                          A !== s && (T = Zf()) !== s
                                            ? ('security' ===
                                              r.substr(_a, 8).toLowerCase()
                                                ? ((I = r.substr(_a, 8)),
                                                  (_a += 8))
                                                : ((I = s), 0 === Ra && Ua(h)),
                                              I !== s && (_ = Zf()) !== s
                                                ? ('definer' ===
                                                  r.substr(_a, 7).toLowerCase()
                                                    ? ((S = r.substr(_a, 7)),
                                                      (_a += 7))
                                                    : ((S = s),
                                                      0 === Ra && Ua(m)),
                                                  S === s &&
                                                    ('invoker' ===
                                                    r
                                                      .substr(_a, 7)
                                                      .toLowerCase()
                                                      ? ((S = r.substr(_a, 7)),
                                                        (_a += 7))
                                                      : ((S = s),
                                                        0 === Ra && Ua(E))),
                                                  S !== s
                                                    ? (l = A = [A, T, I, _, S])
                                                    : ((_a = l), (l = s)))
                                                : ((_a = l), (l = s)))
                                            : ((_a = l), (l = s)),
                                          l === s && (l = null),
                                          l !== s &&
                                          (A = Zf()) !== s &&
                                          (T = Sf()) !== s &&
                                          (I = Zf()) !== s &&
                                          (_ = Gi()) !== s &&
                                          (S = Zf()) !== s
                                            ? ((N = _a),
                                              (g = Wf()) !== s &&
                                              (R = Zf()) !== s &&
                                              (O = Ic()) !== s &&
                                              (x = Zf()) !== s &&
                                              (j = Vf()) !== s
                                                ? (N = g = [g, R, O, x, j])
                                                : ((_a = N), (N = s)),
                                              N === s && (N = null),
                                              N !== s &&
                                              (g = Zf()) !== s &&
                                              (R = Sl()) !== s &&
                                              (O = Zf()) !== s &&
                                              (x = Ai()) !== s &&
                                              (j = Zf()) !== s
                                                ? ((k = (function () {
                                                    var t, e, n, o, u;
                                                    ((t = _a),
                                                      (e = Pl()) !== s &&
                                                      Zf() !== s
                                                        ? ('cascaded' ===
                                                          r
                                                            .substr(_a, 8)
                                                            .toLowerCase()
                                                            ? ((n = r.substr(
                                                                _a,
                                                                8
                                                              )),
                                                              (_a += 8))
                                                            : ((n = s),
                                                              0 === Ra &&
                                                                Ua(f)),
                                                          n === s &&
                                                            ('local' ===
                                                            r
                                                              .substr(_a, 5)
                                                              .toLowerCase()
                                                              ? ((n = r.substr(
                                                                  _a,
                                                                  5
                                                                )),
                                                                (_a += 5))
                                                              : ((n = s),
                                                                0 === Ra &&
                                                                  Ua(b))),
                                                          n !== s && Zf() !== s
                                                            ? ('check' ===
                                                              r
                                                                .substr(_a, 5)
                                                                .toLowerCase()
                                                                ? ((o =
                                                                    r.substr(
                                                                      _a,
                                                                      5
                                                                    )),
                                                                  (_a += 5))
                                                                : ((o = s),
                                                                  0 === Ra &&
                                                                    Ua(p)),
                                                              o !== s &&
                                                              Zf() !== s
                                                                ? ('OPTION' ===
                                                                  r.substr(
                                                                    _a,
                                                                    6
                                                                  )
                                                                    ? ((u =
                                                                        'OPTION'),
                                                                      (_a += 6))
                                                                    : ((u = s),
                                                                      0 ===
                                                                        Ra &&
                                                                        Ua(v)),
                                                                  u !== s
                                                                    ? (t,
                                                                      (e = `with ${n.toLowerCase()} check option`),
                                                                      (t = e))
                                                                    : ((_a = t),
                                                                      (t = s)))
                                                                : ((_a = t),
                                                                  (t = s)))
                                                            : ((_a = t),
                                                              (t = s)))
                                                        : ((_a = t), (t = s)));
                                                    t === s &&
                                                      ((t = _a),
                                                      (e = Pl()) !== s &&
                                                      Zf() !== s
                                                        ? ('check' ===
                                                          r
                                                            .substr(_a, 5)
                                                            .toLowerCase()
                                                            ? ((n = r.substr(
                                                                _a,
                                                                5
                                                              )),
                                                              (_a += 5))
                                                            : ((n = s),
                                                              0 === Ra &&
                                                                Ua(p)),
                                                          n !== s && Zf() !== s
                                                            ? ('OPTION' ===
                                                              r.substr(_a, 6)
                                                                ? ((o =
                                                                    'OPTION'),
                                                                  (_a += 6))
                                                                : ((o = s),
                                                                  0 === Ra &&
                                                                    Ua(v)),
                                                              o !== s
                                                                ? (t,
                                                                  (t = e =
                                                                    'with check option'))
                                                                : ((_a = t),
                                                                  (t = s)))
                                                            : ((_a = t),
                                                              (t = s)))
                                                        : ((_a = t), (t = s)));
                                                    return t;
                                                  })()) === s && (k = null),
                                                  k !== s
                                                    ? (t,
                                                      (U = e),
                                                      (M = n),
                                                      (D = u),
                                                      (P = i),
                                                      (G = l),
                                                      ($ = N),
                                                      (H = x),
                                                      (Y = k),
                                                      ((F = _).view = F.table),
                                                      delete F.table,
                                                      (e = {
                                                        tableList:
                                                          Array.from(gb),
                                                        columnList: Sb(Rb),
                                                        ast: {
                                                          type: U[0].toLowerCase(),
                                                          keyword: 'view',
                                                          replace:
                                                            M && 'or replace',
                                                          algorithm: D && D[4],
                                                          definer: P,
                                                          sql_security:
                                                            G && G[4],
                                                          columns: $ && $[2],
                                                          select: H,
                                                          view: F,
                                                          with: Y,
                                                        },
                                                      }),
                                                      (t = e))
                                                    : ((_a = t), (t = s)))
                                                : ((_a = t), (t = s)))
                                            : ((_a = t), (t = s)))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)));
                        var U, M, D, P, G, F, $, H, Y;
                        return t;
                      })());
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'truncate' === r.substr(_a, 8).toLowerCase()
                            ? ((e = r.substr(_a, 8)), (_a += 8))
                            : ((e = s), 0 === Ra && Ua(pu)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s
                              ? (t, (t = e = 'TRUNCATE'))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s && Zf() !== s
                        ? ((n = Nl()) === s && (n = null),
                          n !== s && Zf() !== s && (o = Ui()) !== s
                            ? (t,
                              (u = e),
                              (a = n),
                              (i = o) &&
                                i.forEach((r) =>
                                  gb.add(`${u}::${r.db}::${r.table}`)
                                ),
                              (e = {
                                tableList: Array.from(gb),
                                columnList: Sb(Rb),
                                ast: {
                                  type: u.toLowerCase(),
                                  keyword: (a && a.toLowerCase()) || 'table',
                                  name: i,
                                },
                              }),
                              (t = e))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    var u, a, i;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e;
                    ((r = _a),
                      (t = ml()) !== s &&
                      Zf() !== s &&
                      Nl() !== s &&
                      Zf() !== s &&
                      (e = (function () {
                        var r, t, e, n, o, u, a, i;
                        if (((r = _a), (t = Oi()) !== s)) {
                          for (
                            e = [],
                              n = _a,
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = Oi()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s));
                            n !== s;

                          )
                            (e.push(n),
                              (n = _a),
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = Oi()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s)));
                          e !== s
                            ? (r, (t = A(t, e)), (r = t))
                            : ((_a = r), (r = s));
                        } else ((_a = r), (r = s));
                        return r;
                      })()) !== s
                        ? (r,
                          (n = e).forEach((r) =>
                            r.forEach(
                              (r) =>
                                r.table && gb.add(`rename::${r.db}::${r.table}`)
                            )
                          ),
                          (t = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'rename', table: n },
                          }),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var n;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'call' === r.substr(_a, 4).toLowerCase()
                            ? ((e = r.substr(_a, 4)), (_a += 4))
                            : ((e = s), 0 === Ra && Ua(ks)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s
                              ? (t, (t = e = 'CALL'))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      (n = (function () {
                        var r;
                        (r = fb()) === s && (r = bb());
                        return r;
                      })()) !== s
                        ? (t,
                          (o = n),
                          (e = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'call', expr: o },
                          }),
                          (t = e))
                        : ((_a = t), (t = s)));
                    var o;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'use' === r.substr(_a, 3).toLowerCase()
                            ? ((e = r.substr(_a, 3)), (_a += 3))
                            : ((e = s), 0 === Ra && Ua(_o)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      (n = _c()) !== s
                        ? (t,
                          (o = n),
                          gb.add(`use::${o}::null`),
                          (e = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'use', db: o },
                          }),
                          (t = e))
                        : ((_a = t), (t = s)));
                    var o;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n;
                    ((r = _a),
                      (t = pl()) !== s &&
                      Zf() !== s &&
                      Nl() !== s &&
                      Zf() !== s &&
                      (e = Gi()) !== s &&
                      Zf() !== s &&
                      (n = (function () {
                        var r, t, e, n, o, u, a, i;
                        if (((r = _a), (t = Za()) !== s)) {
                          for (
                            e = [],
                              n = _a,
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = Za()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s));
                            n !== s;

                          )
                            (e.push(n),
                              (n = _a),
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = Za()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s)));
                          e !== s
                            ? (r, (t = A(t, e)), (r = t))
                            : ((_a = r), (r = s));
                        } else ((_a = r), (r = s));
                        return r;
                      })()) !== s
                        ? (r,
                          (o = e),
                          (u = n),
                          gb.add(`alter::${o.db}::${o.table}`),
                          (t = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'alter', table: [o], expr: u },
                          }),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var o, u;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      (e = _l()) !== s && Zf() !== s
                        ? ((n = (function () {
                            var t, e, n, o;
                            ((t = _a),
                              'global' === r.substr(_a, 6).toLowerCase()
                                ? ((e = r.substr(_a, 6)), (_a += 6))
                                : ((e = s), 0 === Ra && Ua(Au)));
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'GLOBAL'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s));
                            return t;
                          })()) === s &&
                            (n = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'session' === r.substr(_a, 7).toLowerCase()
                                  ? ((e = r.substr(_a, 7)), (_a += 7))
                                  : ((e = s), 0 === Ra && Ua(Tu)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'SESSION'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s &&
                            (n = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'local' === r.substr(_a, 5).toLowerCase()
                                  ? ((e = r.substr(_a, 5)), (_a += 5))
                                  : ((e = s), 0 === Ra && Ua(b)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'LOCAL'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s &&
                            (n = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'persist' === r.substr(_a, 7).toLowerCase()
                                  ? ((e = r.substr(_a, 7)), (_a += 7))
                                  : ((e = s), 0 === Ra && Ua(Iu)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'PERSIST'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s &&
                            (n = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'persist_only' ===
                                r.substr(_a, 12).toLowerCase()
                                  ? ((e = r.substr(_a, 12)), (_a += 12))
                                  : ((e = s), 0 === Ra && Ua(_u)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'PERSIST_ONLY'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()),
                          n === s && (n = null),
                          n !== s && Zf() !== s && (o = sb()) !== s
                            ? (t,
                              (u = n),
                              ((a = o).keyword = u),
                              (e = {
                                tableList: Array.from(gb),
                                columnList: Sb(Rb),
                                ast: { type: 'set', expr: a },
                              }),
                              (t = e))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    var u, a;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'lock' === r.substr(_a, 4).toLowerCase()
                            ? ((e = r.substr(_a, 4)), (_a += 4))
                            : ((e = s), 0 === Ra && Ua(rr)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      Rl() !== s &&
                      Zf() !== s &&
                      (n = (function () {
                        var r, t, e, n, o, u, a, i;
                        if (((r = _a), (t = li()) !== s)) {
                          for (
                            e = [],
                              n = _a,
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = li()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s));
                            n !== s;

                          )
                            (e.push(n),
                              (n = _a),
                              (o = Zf()) !== s &&
                              (u = Yf()) !== s &&
                              (a = Zf()) !== s &&
                              (i = li()) !== s
                                ? (n = o = [o, u, a, i])
                                : ((_a = n), (n = s)));
                          e !== s
                            ? (r, (t = qr(t, e)), (r = t))
                            : ((_a = r), (r = s));
                        } else ((_a = r), (r = s));
                        return r;
                      })()) !== s
                        ? (t,
                          (o = n),
                          (e = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'lock', keyword: 'tables', tables: o },
                          }),
                          (t = e))
                        : ((_a = t), (t = s)));
                    var o;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'unlock' === r.substr(_a, 6).toLowerCase()
                            ? ((e = r.substr(_a, 6)), (_a += 6))
                            : ((e = s), 0 === Ra && Ua($o)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      Rl() !== s
                        ? (t,
                          (e = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'unlock', keyword: 'tables' },
                          }),
                          (t = e))
                        : ((_a = t), (t = s)));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a, i, c, l;
                    ((t = _a),
                      (e = fl()) !== s && Zf() !== s
                        ? ('binary' === r.substr(_a, 6).toLowerCase()
                            ? ((n = r.substr(_a, 6)), (_a += 6))
                            : ((n = s), 0 === Ra && Ua(Xr)),
                          n === s &&
                            ('master' === r.substr(_a, 6).toLowerCase()
                              ? ((n = r.substr(_a, 6)), (_a += 6))
                              : ((n = s), 0 === Ra && Ua(Kr))),
                          n !== s && (o = Zf()) !== s
                            ? ('logs' === r.substr(_a, 4).toLowerCase()
                                ? ((u = r.substr(_a, 4)), (_a += 4))
                                : ((u = s), 0 === Ra && Ua(Qr)),
                              u !== s
                                ? (t,
                                  (f = n),
                                  (e = {
                                    tableList: Array.from(gb),
                                    columnList: Sb(Rb),
                                    ast: {
                                      type: 'show',
                                      suffix: 'logs',
                                      keyword: f.toLowerCase(),
                                    },
                                  }),
                                  (t = e))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    var f;
                    t === s &&
                      ((t = _a),
                      (e = fl()) !== s && Zf() !== s && (n = Rl()) !== s
                        ? (t,
                          (e = {
                            tableList: Array.from(gb),
                            columnList: Sb(Rb),
                            ast: { type: 'show', keyword: 'tables' },
                          }),
                          (t = e))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = fl()) !== s && Zf() !== s
                          ? ('triggers' === r.substr(_a, 8).toLowerCase()
                              ? ((n = r.substr(_a, 8)), (_a += 8))
                              : ((n = s), 0 === Ra && Ua(Zr)),
                            n === s &&
                              ('status' === r.substr(_a, 6).toLowerCase()
                                ? ((n = r.substr(_a, 6)), (_a += 6))
                                : ((n = s), 0 === Ra && Ua(zr)),
                              n === s &&
                                ('processlist' ===
                                r.substr(_a, 11).toLowerCase()
                                  ? ((n = r.substr(_a, 11)), (_a += 11))
                                  : ((n = s), 0 === Ra && Ua(Jr)))),
                            n !== s
                              ? (t,
                                (d = n),
                                (e = {
                                  tableList: Array.from(gb),
                                  columnList: Sb(Rb),
                                  ast: {
                                    type: 'show',
                                    keyword: d.toLowerCase(),
                                  },
                                }),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)),
                        t === s &&
                          ((t = _a),
                          (e = fl()) !== s && Zf() !== s
                            ? ('procedure' === r.substr(_a, 9).toLowerCase()
                                ? ((n = r.substr(_a, 9)), (_a += 9))
                                : ((n = s), 0 === Ra && Ua(rt)),
                              n === s &&
                                ('function' === r.substr(_a, 8).toLowerCase()
                                  ? ((n = r.substr(_a, 8)), (_a += 8))
                                  : ((n = s), 0 === Ra && Ua(tt))),
                              n !== s && (o = Zf()) !== s
                                ? ('status' === r.substr(_a, 6).toLowerCase()
                                    ? ((u = r.substr(_a, 6)), (_a += 6))
                                    : ((u = s), 0 === Ra && Ua(zr)),
                                  u !== s
                                    ? (t,
                                      (e = (function (r) {
                                        return {
                                          tableList: Array.from(gb),
                                          columnList: Sb(Rb),
                                          ast: {
                                            type: 'show',
                                            keyword: r.toLowerCase(),
                                            suffix: 'status',
                                          },
                                        };
                                      })(n)),
                                      (t = e))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t === s &&
                            ((t = _a),
                            (e = fl()) !== s && Zf() !== s
                              ? ('binlog' === r.substr(_a, 6).toLowerCase()
                                  ? ((n = r.substr(_a, 6)), (_a += 6))
                                  : ((n = s), 0 === Ra && Ua(et)),
                                n !== s && (o = Zf()) !== s
                                  ? ('events' === r.substr(_a, 6).toLowerCase()
                                      ? ((u = r.substr(_a, 6)), (_a += 6))
                                      : ((u = s), 0 === Ra && Ua(nt)),
                                    u !== s && (a = Zf()) !== s
                                      ? ((i = wc()) === s && (i = null),
                                        i !== s && Zf() !== s
                                          ? ((c = Ri()) === s && (c = null),
                                            c !== s && Zf() !== s
                                              ? ((l = qi()) === s && (l = null),
                                                l !== s
                                                  ? (t,
                                                    (b = i),
                                                    (p = c),
                                                    (v = l),
                                                    (e = {
                                                      tableList: Array.from(gb),
                                                      columnList: Sb(Rb),
                                                      ast: {
                                                        type: 'show',
                                                        suffix: 'events',
                                                        keyword: 'binlog',
                                                        in: b,
                                                        from: p,
                                                        limit: v,
                                                      },
                                                    }),
                                                    (t = e))
                                                  : ((_a = t), (t = s)))
                                              : ((_a = t), (t = s)))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t === s &&
                              ((t = _a),
                              (e = fl()) !== s && Zf() !== s
                                ? ((n = _a),
                                  'character' === r.substr(_a, 9).toLowerCase()
                                    ? ((o = r.substr(_a, 9)), (_a += 9))
                                    : ((o = s), 0 === Ra && Ua(hr)),
                                  o !== s && (u = Zf()) !== s
                                    ? ('set' === r.substr(_a, 3).toLowerCase()
                                        ? ((a = r.substr(_a, 3)), (_a += 3))
                                        : ((a = s), 0 === Ra && Ua(mr)),
                                      a !== s
                                        ? (n = o = [o, u, a])
                                        : ((_a = n), (n = s)))
                                    : ((_a = n), (n = s)),
                                  n === s &&
                                    ('collation' ===
                                    r.substr(_a, 9).toLowerCase()
                                      ? ((n = r.substr(_a, 9)), (_a += 9))
                                      : ((n = s), 0 === Ra && Ua(ot)),
                                    n === s &&
                                      ('databases' ===
                                      r.substr(_a, 9).toLowerCase()
                                        ? ((n = r.substr(_a, 9)), (_a += 9))
                                        : ((n = s), 0 === Ra && Ua(st)))),
                                  n !== s && (o = Zf()) !== s
                                    ? ((u = yc()) === s && (u = $i()),
                                      u === s && (u = null),
                                      u !== s
                                        ? (t,
                                          (e = (function (r, t) {
                                            let e = (Array.isArray(r) && r) || [
                                              r,
                                            ];
                                            return {
                                              tableList: Array.from(gb),
                                              columnList: Sb(Rb),
                                              ast: {
                                                type: 'show',
                                                suffix:
                                                  e[2] && e[2].toLowerCase(),
                                                keyword: e[0].toLowerCase(),
                                                expr: t,
                                              },
                                            };
                                          })(n, u)),
                                          (t = e))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)),
                              t === s &&
                                ((t = _a),
                                (e = fl()) !== s && Zf() !== s
                                  ? ('columns' === r.substr(_a, 7).toLowerCase()
                                      ? ((n = r.substr(_a, 7)), (_a += 7))
                                      : ((n = s), 0 === Ra && Ua(ut)),
                                    n === s &&
                                      ('indexes' ===
                                      r.substr(_a, 7).toLowerCase()
                                        ? ((n = r.substr(_a, 7)), (_a += 7))
                                        : ((n = s), 0 === Ra && Ua(at))),
                                    n !== s &&
                                    (o = Zf()) !== s &&
                                    (u = Ri()) !== s
                                      ? (t,
                                        (e = (function (r, t) {
                                          return {
                                            tableList: Array.from(gb),
                                            columnList: Sb(Rb),
                                            ast: {
                                              type: 'show',
                                              keyword: r.toLowerCase(),
                                              from: t,
                                            },
                                          };
                                        })(n, u)),
                                        (t = e))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)),
                                t === s &&
                                  ((t = _a),
                                  (e = fl()) !== s &&
                                  Zf() !== s &&
                                  (n = yl()) !== s &&
                                  (o = Zf()) !== s
                                    ? ((u = Sf()) === s &&
                                        (u = Nl()) === s &&
                                        ('event' ===
                                        r.substr(_a, 5).toLowerCase()
                                          ? ((u = r.substr(_a, 5)), (_a += 5))
                                          : ((u = s), 0 === Ra && Ua(it)),
                                        u === s &&
                                          (u = gl()) === s &&
                                          ('procedure' ===
                                          r.substr(_a, 9).toLowerCase()
                                            ? ((u = r.substr(_a, 9)), (_a += 9))
                                            : ((u = s), 0 === Ra && Ua(rt)))),
                                      u !== s &&
                                      (a = Zf()) !== s &&
                                      (i = Gi()) !== s
                                        ? (t,
                                          (e = (function (r, t) {
                                            const e = r.toLowerCase();
                                            return {
                                              tableList: Array.from(gb),
                                              columnList: Sb(Rb),
                                              ast: {
                                                type: 'show',
                                                keyword: 'create',
                                                suffix: e,
                                                [e]: t,
                                              },
                                            };
                                          })(u, i)),
                                          (t = e))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)),
                                  t === s &&
                                    (t = (function () {
                                      var t, e, n, o;
                                      ((t = _a),
                                        (e = fl()) !== s && Zf() !== s
                                          ? ('grants' ===
                                            r.substr(_a, 6).toLowerCase()
                                              ? ((n = r.substr(_a, 6)),
                                                (_a += 6))
                                              : ((n = s), 0 === Ra && Ua(ct)),
                                            n !== s && Zf() !== s
                                              ? ((o = (function () {
                                                  var t, e, n, o, u, a, i;
                                                  ((t = _a),
                                                    'for' ===
                                                    r
                                                      .substr(_a, 3)
                                                      .toLowerCase()
                                                      ? ((e = r.substr(_a, 3)),
                                                        (_a += 3))
                                                      : ((e = s),
                                                        0 === Ra && Ua(O)));
                                                  e !== s &&
                                                  Zf() !== s &&
                                                  (n = _c()) !== s &&
                                                  Zf() !== s
                                                    ? ((o = _a),
                                                      (u = Nf()) !== s &&
                                                      (a = Zf()) !== s &&
                                                      (i = _c()) !== s
                                                        ? (o = u = [u, a, i])
                                                        : ((_a = o), (o = s)),
                                                      o === s && (o = null),
                                                      o !== s &&
                                                      (u = Zf()) !== s
                                                        ? ((a = (function () {
                                                            var r, t;
                                                            ((r = _a),
                                                              Dl() !== s &&
                                                              Zf() !== s &&
                                                              (t =
                                                                (function () {
                                                                  var r,
                                                                    t,
                                                                    e,
                                                                    n,
                                                                    o,
                                                                    u,
                                                                    a,
                                                                    i;
                                                                  if (
                                                                    ((r = _a),
                                                                    (t =
                                                                      _c()) !==
                                                                      s)
                                                                  ) {
                                                                    for (
                                                                      e = [],
                                                                        n = _a,
                                                                        (o =
                                                                          Zf()) !==
                                                                          s &&
                                                                        (u =
                                                                          Yf()) !==
                                                                          s &&
                                                                        (a =
                                                                          Zf()) !==
                                                                          s &&
                                                                        (i =
                                                                          _c()) !==
                                                                          s
                                                                          ? (n =
                                                                              o =
                                                                                [
                                                                                  o,
                                                                                  u,
                                                                                  a,
                                                                                  i,
                                                                                ])
                                                                          : ((_a =
                                                                              n),
                                                                            (n =
                                                                              s));
                                                                      n !== s;

                                                                    )
                                                                      (e.push(
                                                                        n
                                                                      ),
                                                                        (n =
                                                                          _a),
                                                                        (o =
                                                                          Zf()) !==
                                                                          s &&
                                                                        (u =
                                                                          Yf()) !==
                                                                          s &&
                                                                        (a =
                                                                          Zf()) !==
                                                                          s &&
                                                                        (i =
                                                                          _c()) !==
                                                                          s
                                                                          ? (n =
                                                                              o =
                                                                                [
                                                                                  o,
                                                                                  u,
                                                                                  a,
                                                                                  i,
                                                                                ])
                                                                          : ((_a =
                                                                              n),
                                                                            (n =
                                                                              s)));
                                                                    e !== s
                                                                      ? (r,
                                                                        (t = qr(
                                                                          t,
                                                                          e
                                                                        )),
                                                                        (r = t))
                                                                      : ((_a =
                                                                          r),
                                                                        (r =
                                                                          s));
                                                                  } else
                                                                    ((_a = r),
                                                                      (r = s));
                                                                  return r;
                                                                })()) !== s
                                                                ? (r, (r = t))
                                                                : ((_a = r),
                                                                  (r = s)));
                                                            return r;
                                                          })()) === s &&
                                                            (a = null),
                                                          a !== s
                                                            ? (t,
                                                              (l = a),
                                                              (e = {
                                                                user: n,
                                                                host:
                                                                  (c = o) &&
                                                                  c[2],
                                                                role_list: l,
                                                              }),
                                                              (t = e))
                                                            : ((_a = t),
                                                              (t = s)))
                                                        : ((_a = t), (t = s)))
                                                    : ((_a = t), (t = s));
                                                  var c, l;
                                                  return t;
                                                })()) === s && (o = null),
                                                o !== s
                                                  ? (t,
                                                    (u = o),
                                                    (e = {
                                                      tableList: Array.from(gb),
                                                      columnList: Sb(Rb),
                                                      ast: {
                                                        type: 'show',
                                                        keyword: 'grants',
                                                        for: u,
                                                      },
                                                    }),
                                                    (t = e))
                                                  : ((_a = t), (t = s)))
                                              : ((_a = t), (t = s)))
                                          : ((_a = t), (t = s)));
                                      var u;
                                      return t;
                                    })()))))))));
                    var b, p, v;
                    var d;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = Hl()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'describe' === r.substr(_a, 8).toLowerCase()
                              ? ((e = r.substr(_a, 8)), (_a += 8))
                              : ((e = s), 0 === Ra && Ua(ys)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'DESCRIBE'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })()));
                    e !== s && Zf() !== s && (n = _c()) !== s
                      ? (t,
                        (o = n),
                        (e = {
                          tableList: Array.from(gb),
                          columnList: Sb(Rb),
                          ast: { type: 'desc', table: o },
                        }),
                        (t = e))
                      : ((_a = t), (t = s));
                    var o;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a, i, c, l;
                    ((t = _a),
                      'grant' === r.substr(_a, 5).toLowerCase()
                        ? ((e = r.substr(_a, 5)), (_a += 5))
                        : ((e = s), 0 === Ra && Ua(ft)));
                    e !== s &&
                    Zf() !== s &&
                    (n = (function () {
                      var r, t, e, n, o, u, a, i;
                      if (((r = _a), (t = bi()) !== s)) {
                        for (
                          e = [],
                            n = _a,
                            (o = Zf()) !== s &&
                            (u = Yf()) !== s &&
                            (a = Zf()) !== s &&
                            (i = bi()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s));
                          n !== s;

                        )
                          (e.push(n),
                            (n = _a),
                            (o = Zf()) !== s &&
                            (u = Yf()) !== s &&
                            (a = Zf()) !== s &&
                            (i = bi()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s)));
                        e !== s
                          ? (r, (t = yt(t, e)), (r = t))
                          : ((_a = r), (r = s));
                      } else ((_a = r), (r = s));
                      return r;
                    })()) !== s &&
                    Zf() !== s &&
                    (o = jl()) !== s &&
                    Zf() !== s
                      ? ((u = (function () {
                          var t, e;
                          ((t = _a),
                            (e = Nl()) === s &&
                              ('function' === r.substr(_a, 8).toLowerCase()
                                ? ((e = r.substr(_a, 8)), (_a += 8))
                                : ((e = s), 0 === Ra && Ua(tt)),
                              e === s &&
                                ('procedure' === r.substr(_a, 9).toLowerCase()
                                  ? ((e = r.substr(_a, 9)), (_a += 9))
                                  : ((e = s), 0 === Ra && Ua(rt)))));
                          e !== s &&
                            (t,
                            (e = { type: 'origin', value: e.toUpperCase() }));
                          return (t = e);
                        })()) === s && (u = null),
                        u !== s &&
                        Zf() !== s &&
                        (a = (function () {
                          var r, t, e, n, o;
                          ((r = _a), (t = _a), (e = _c()) === s && (e = Bf()));
                          e !== s && (n = Zf()) !== s && (o = Hf()) !== s
                            ? (t = e = [e, n, o])
                            : ((_a = t), (t = s));
                          t === s && (t = null);
                          t !== s && (e = Zf()) !== s
                            ? ((n = _c()) === s && (n = Bf()),
                              n !== s
                                ? (r,
                                  (a = n),
                                  (t = { prefix: (u = t) && u[0], name: a }),
                                  (r = t))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s));
                          var u, a;
                          return r;
                        })()) !== s &&
                        Zf() !== s &&
                        (i = ll()) !== s &&
                        Zf() !== s &&
                        (c = vi()) !== s &&
                        Zf() !== s
                          ? ((l = (function () {
                              var t, e, n;
                              ((t = _a),
                                Pl() !== s && Zf() !== s
                                  ? ('grant' === r.substr(_a, 5).toLowerCase()
                                      ? ((e = r.substr(_a, 5)), (_a += 5))
                                      : ((e = s), 0 === Ra && Ua(ft)),
                                    e !== s && Zf() !== s
                                      ? ('option' ===
                                        r.substr(_a, 6).toLowerCase()
                                          ? ((n = r.substr(_a, 6)), (_a += 6))
                                          : ((n = s), 0 === Ra && Ua(bt)),
                                        n !== s
                                          ? (t,
                                            (t = {
                                              type: 'origin',
                                              value: 'with grant option',
                                            }))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)));
                              return t;
                            })()) === s && (l = null),
                            l !== s
                              ? (t,
                                (f = n),
                                (b = u),
                                (p = a),
                                (v = i),
                                (d = c),
                                (y = l),
                                (e = {
                                  tableList: Array.from(gb),
                                  columnList: Sb(Rb),
                                  ast: {
                                    type: 'grant',
                                    keyword: 'priv',
                                    objects: f,
                                    on: { object_type: b, priv_level: [p] },
                                    to_from: v[0],
                                    user_or_roles: d,
                                    with: y,
                                  },
                                }),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    var f, b, p, v, d, y;
                    t === s &&
                      ((t = _a),
                      'GRANT' === r.substr(_a, 5)
                        ? ((e = 'GRANT'), (_a += 5))
                        : ((e = s), 0 === Ra && Ua(Lt)),
                      e !== s && Zf() !== s
                        ? ('PROXY' === r.substr(_a, 5)
                            ? ((n = 'PROXY'), (_a += 5))
                            : ((n = s), 0 === Ra && Ua(Ct)),
                          n !== s &&
                          Zf() !== s &&
                          (o = jl()) !== s &&
                          Zf() !== s &&
                          (u = pi()) !== s &&
                          Zf() !== s &&
                          (a = ll()) !== s &&
                          Zf() !== s &&
                          (i = vi()) !== s &&
                          Zf() !== s
                            ? ((c = di()) === s && (c = null),
                              c !== s
                                ? (t,
                                  (e = (function (r, t, e, n) {
                                    return {
                                      tableList: Array.from(gb),
                                      columnList: Sb(Rb),
                                      ast: {
                                        type: 'grant',
                                        keyword: 'proxy',
                                        objects: [
                                          {
                                            priv: {
                                              type: 'origin',
                                              value: 'proxy',
                                            },
                                          },
                                        ],
                                        on: r,
                                        to_from: t[0],
                                        user_or_roles: e,
                                        with: n,
                                      },
                                    };
                                  })(u, a, i, c)),
                                  (t = e))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        'GRANT' === r.substr(_a, 5)
                          ? ((e = 'GRANT'), (_a += 5))
                          : ((e = s), 0 === Ra && Ua(Lt)),
                        e !== s &&
                        Zf() !== s &&
                        (n = (function () {
                          var r, t, e, n, o, u, a, i;
                          if (((r = _a), (t = _c()) !== s)) {
                            for (
                              e = [],
                                n = _a,
                                (o = Zf()) !== s &&
                                (u = Yf()) !== s &&
                                (a = Zf()) !== s &&
                                (i = _c()) !== s
                                  ? (n = o = [o, u, a, i])
                                  : ((_a = n), (n = s));
                              n !== s;

                            )
                              (e.push(n),
                                (n = _a),
                                (o = Zf()) !== s &&
                                (u = Yf()) !== s &&
                                (a = Zf()) !== s &&
                                (i = _c()) !== s
                                  ? (n = o = [o, u, a, i])
                                  : ((_a = n), (n = s)));
                            e !== s
                              ? (r, (t = yt(t, e)), (r = t))
                              : ((_a = r), (r = s));
                          } else ((_a = r), (r = s));
                          return r;
                        })()) !== s &&
                        Zf() !== s &&
                        (o = ll()) !== s &&
                        Zf() !== s &&
                        (u = vi()) !== s &&
                        Zf() !== s
                          ? ((a = di()) === s && (a = null),
                            a !== s
                              ? (t,
                                (e = (function (r, t, e, n) {
                                  return {
                                    tableList: Array.from(gb),
                                    columnList: Sb(Rb),
                                    ast: {
                                      type: 'grant',
                                      keyword: 'role',
                                      objects: r.map((r) => ({
                                        priv: { type: 'string', value: r },
                                      })),
                                      to_from: t[0],
                                      user_or_roles: e,
                                      with: n,
                                    },
                                  };
                                })(n, o, u, a)),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s))));
                    return t;
                  })()),
                t
              );
            }
            function Fa() {
              var r;
              return (
                (r = Ha()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i;
                    ((r = _a),
                      (t = Zf()) !== s
                        ? ((e = wi()) === s && (e = null),
                          e !== s &&
                          Zf() !== s &&
                          dl() !== s &&
                          Zf() !== s &&
                          (n = Ui()) !== s &&
                          Zf() !== s &&
                          _l() !== s &&
                          Zf() !== s &&
                          (o = Xi()) !== s &&
                          Zf() !== s
                            ? ((u = $i()) === s && (u = null),
                              u !== s && Zf() !== s
                                ? ((a = Bi()) === s && (a = null),
                                  a !== s && Zf() !== s
                                    ? ((i = qi()) === s && (i = null),
                                      i !== s
                                        ? (r,
                                          (t = (function (r, t, e, n, o, s) {
                                            const u = {};
                                            return (
                                              t &&
                                                t.forEach((r) => {
                                                  const {
                                                      db: t,
                                                      as: e,
                                                      table: n,
                                                      join: o,
                                                    } = r,
                                                    s = o ? 'select' : 'update';
                                                  (t && (u[n] = t),
                                                    n &&
                                                      gb.add(
                                                        `${s}::${t}::${n}`
                                                      ));
                                                }),
                                              e &&
                                                e.forEach((r) => {
                                                  if (r.table) {
                                                    const t = _b(r.table);
                                                    gb.add(
                                                      `update::${u[t] || null}::${t}`
                                                    );
                                                  }
                                                  Rb.add(
                                                    `update::${r.table}::${r.column}`
                                                  );
                                                }),
                                              {
                                                tableList: Array.from(gb),
                                                columnList: Sb(Rb),
                                                ast: {
                                                  with: r,
                                                  type: 'update',
                                                  table: t,
                                                  set: e,
                                                  where: n,
                                                  orderby: o,
                                                  limit: s,
                                                },
                                              }
                                            );
                                          })(e, n, o, u, a, i)),
                                          (r = t))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i, c;
                    ((r = _a),
                      (t = Ji()) !== s && Zf() !== s
                        ? ((e = El()) === s && (e = null),
                          e !== s && Zf() !== s
                            ? ((n = Tl()) === s && (n = null),
                              n !== s &&
                              Zf() !== s &&
                              (o = Gi()) !== s &&
                              Zf() !== s
                                ? ((u = Zi()) === s && (u = null),
                                  u !== s &&
                                  Zf() !== s &&
                                  Wf() !== s &&
                                  Zf() !== s &&
                                  (a = Ic()) !== s &&
                                  Zf() !== s &&
                                  Vf() !== s &&
                                  Zf() !== s &&
                                  (i = Qi()) !== s &&
                                  Zf() !== s
                                    ? ((c = zi()) === s && (c = null),
                                      c !== s
                                        ? (r,
                                          (t = (function (
                                            r,
                                            t,
                                            e,
                                            n,
                                            o,
                                            s,
                                            u,
                                            a
                                          ) {
                                            if (
                                              (n &&
                                                (gb.add(
                                                  `insert::${n.db}::${n.table}`
                                                ),
                                                (n.as = null)),
                                              s)
                                            ) {
                                              let r = (n && n.table) || null;
                                              (Array.isArray(u) &&
                                                u.forEach((r, t) => {
                                                  if (
                                                    r.value.length != s.length
                                                  )
                                                    throw new Error(
                                                      "Error: column count doesn't match value count at row " +
                                                        (t + 1)
                                                    );
                                                }),
                                                s.forEach((t) =>
                                                  Rb.add(`insert::${r}::${t}`)
                                                ));
                                            }
                                            const i = [t, e]
                                              .filter((r) => r)
                                              .map(
                                                (r) =>
                                                  r[0] && r[0].toLowerCase()
                                              )
                                              .join(' ');
                                            return {
                                              tableList: Array.from(gb),
                                              columnList: Sb(Rb),
                                              ast: {
                                                type: r,
                                                table: [n],
                                                columns: s,
                                                values: u,
                                                partition: o,
                                                prefix: i,
                                                on_duplicate_update: a,
                                              },
                                            };
                                          })(t, e, n, o, u, a, i, c)),
                                          (r = t))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i;
                    ((r = _a),
                      (t = Ji()) !== s && Zf() !== s
                        ? ((e = El()) === s && (e = null),
                          e !== s && Zf() !== s
                            ? ((n = Tl()) === s && (n = null),
                              n !== s &&
                              Zf() !== s &&
                              (o = Gi()) !== s &&
                              Zf() !== s
                                ? ((u = Zi()) === s && (u = null),
                                  u !== s &&
                                  Zf() !== s &&
                                  (a = Qi()) !== s &&
                                  Zf() !== s
                                    ? ((i = zi()) === s && (i = null),
                                      i !== s
                                        ? (r,
                                          (t = (function (r, t, e, n, o, s, u) {
                                            n &&
                                              (gb.add(
                                                `insert::${n.db}::${n.table}`
                                              ),
                                              Rb.add(
                                                `insert::${n.table}::(.*)`
                                              ),
                                              (n.as = null));
                                            const a = [t, e]
                                              .filter((r) => r)
                                              .map(
                                                (r) =>
                                                  r[0] && r[0].toLowerCase()
                                              )
                                              .join(' ');
                                            return {
                                              tableList: Array.from(gb),
                                              columnList: Sb(Rb),
                                              ast: {
                                                type: r,
                                                table: [n],
                                                columns: null,
                                                values: s,
                                                partition: o,
                                                prefix: a,
                                                on_duplicate_update: u,
                                              },
                                            };
                                          })(t, e, n, o, u, a, i)),
                                          (r = t))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i;
                    ((r = _a),
                      (t = Ji()) !== s && Zf() !== s
                        ? ((e = El()) === s && (e = null),
                          e !== s && Zf() !== s
                            ? ((n = Tl()) === s && (n = null),
                              n !== s &&
                              Zf() !== s &&
                              (o = Gi()) !== s &&
                              Zf() !== s
                                ? ((u = Zi()) === s && (u = null),
                                  u !== s &&
                                  Zf() !== s &&
                                  _l() !== s &&
                                  Zf() !== s &&
                                  (a = Xi()) !== s &&
                                  Zf() !== s
                                    ? ((i = zi()) === s && (i = null),
                                      i !== s
                                        ? (r,
                                          (t = (function (r, t, e, n, o, s, u) {
                                            n &&
                                              (gb.add(
                                                `insert::${n.db}::${n.table}`
                                              ),
                                              Rb.add(
                                                `insert::${n.table}::(.*)`
                                              ),
                                              (n.as = null));
                                            const a = [t, e]
                                              .filter((r) => r)
                                              .map(
                                                (r) =>
                                                  r[0] && r[0].toLowerCase()
                                              )
                                              .join(' ');
                                            return {
                                              tableList: Array.from(gb),
                                              columnList: Sb(Rb),
                                              ast: {
                                                type: r,
                                                table: [n],
                                                columns: null,
                                                partition: o,
                                                prefix: a,
                                                set: s,
                                                on_duplicate_update: u,
                                              },
                                            };
                                          })(t, e, n, o, u, a, i)),
                                          (r = t))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i;
                    ((r = _a),
                      (t = Zf()) !== s
                        ? ((e = wi()) === s && (e = null),
                          e !== s && Zf() !== s && Ll() !== s && Zf() !== s
                            ? ((n = Ui()) === s && (n = null),
                              n !== s &&
                              Zf() !== s &&
                              (o = Ri()) !== s &&
                              Zf() !== s
                                ? ((u = $i()) === s && (u = null),
                                  u !== s && Zf() !== s
                                    ? ((a = Bi()) === s && (a = null),
                                      a !== s && Zf() !== s
                                        ? ((i = qi()) === s && (i = null),
                                          i !== s
                                            ? (r,
                                              (t = (function (
                                                r,
                                                t,
                                                e,
                                                n,
                                                o,
                                                s
                                              ) {
                                                if (
                                                  (e &&
                                                    e.forEach((r) => {
                                                      const {
                                                          db: t,
                                                          as: e,
                                                          table: n,
                                                          join: o,
                                                        } = r,
                                                        s = o
                                                          ? 'select'
                                                          : 'delete';
                                                      (n &&
                                                        gb.add(
                                                          `${s}::${t}::${n}`
                                                        ),
                                                        o ||
                                                          Rb.add(
                                                            `delete::${n}::(.*)`
                                                          ));
                                                    }),
                                                  null === t && 1 === e.length)
                                                ) {
                                                  const r = e[0];
                                                  t = [
                                                    {
                                                      db: r.db,
                                                      table: r.table,
                                                      as: r.as,
                                                      addition: !0,
                                                    },
                                                  ];
                                                }
                                                return {
                                                  tableList: Array.from(gb),
                                                  columnList: Sb(Rb),
                                                  ast: {
                                                    with: r,
                                                    type: 'delete',
                                                    table: t,
                                                    from: e,
                                                    where: n,
                                                    orderby: o,
                                                    limit: s,
                                                  },
                                                };
                                              })(e, n, o, u, a, i)),
                                              (r = t))
                                            : ((_a = r), (r = s)))
                                        : ((_a = r), (r = s)))
                                    : ((_a = r), (r = s)))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (r = Ga()) === s &&
                  (r = (function () {
                    var r, t;
                    ((r = []), (t = ob()));
                    for (; t !== s; ) (r.push(t), (t = ob()));
                    return r;
                  })()),
                r
              );
            }
            function $a() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'union' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua(ts)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })()) !== s && Zf() !== s
                  ? ((n = Yl()) === s && (n = Bl()),
                    n === s && (n = null),
                    n !== s
                      ? (t,
                        (t = e =
                          (o = n) ? 'union ' + o.toLowerCase() : 'union'))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      'minus' === r.substr(_a, 5).toLowerCase()
                        ? ((e = r.substr(_a, 5)), (_a += 5))
                        : ((e = s), 0 === Ra && Ua(es)));
                    e !== s
                      ? ((n = _a),
                        Ra++,
                        (o = jc()),
                        Ra--,
                        o === s ? (n = void 0) : ((_a = n), (n = s)),
                        n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    return t;
                  })()) !== s && (t, (e = 'minus')),
                  (t = e) === s &&
                    ((t = _a),
                    (e = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'intersect' === r.substr(_a, 9).toLowerCase()
                          ? ((e = r.substr(_a, 9)), (_a += 9))
                          : ((e = s), 0 === Ra && Ua(ns)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) !== s && (t, (e = 'intersect')),
                    (t = e))),
                t
              );
            }
            function Ha() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = yi()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = $a()) !== s &&
                    (a = Zf()) !== s &&
                    (i = yi()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = $a()) !== s &&
                    (a = Zf()) !== s &&
                    (i = yi()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s && (n = Zf()) !== s
                  ? ((o = Bi()) === s && (o = null),
                    o !== s && (u = Zf()) !== s
                      ? ((a = qi()) === s && (a = null),
                        a !== s
                          ? (r,
                            (r = t =
                              (function (r, t, e, n) {
                                let o = r;
                                for (let r = 0; r < t.length; r++)
                                  ((o._next = t[r][3]),
                                    (o.set_op = t[r][1]),
                                    (o = o._next));
                                return (
                                  e && (r._orderby = e),
                                  n && (r._limit = n),
                                  {
                                    tableList: Array.from(gb),
                                    columnList: Sb(Rb),
                                    ast: r,
                                  }
                                );
                              })(t, e, o, a)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function Ya() {
              var r, t, e, n, o;
              return (
                (r = _a),
                (t = ic()) !== s
                  ? ((e = $l()) === s && (e = Hl()),
                    e === s && (e = null),
                    e !== s
                      ? (r,
                        (n = t),
                        (o = e),
                        (r = t = { ...n, order_by: o && o.toLowerCase() }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r === s &&
                  (r = (function () {
                    var r, t, e;
                    ((r = _a),
                      (t = Tc()) !== s && Zf() !== s
                        ? ((e = $l()) === s && (e = Hl()),
                          e === s && (e = null),
                          e !== s
                            ? (r,
                              (t = (function (r, t) {
                                return { ...r, order_by: t && t.toLowerCase() };
                              })(t, e)),
                              (r = t))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()),
                r
              );
            }
            function Ba() {
              var t, e;
              return (
                (t = _a),
                'if' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(l)),
                e !== s && Zf() !== s && Ql() !== s && Zf() !== s && Kl() !== s
                  ? (t, (t = e = 'IF NOT EXISTS'))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Wa() {
              var r;
              return (
                (r = ei()) === s &&
                  (r = qa()) === s &&
                  (r = ri()) === s &&
                  (r = ti()),
                r
              );
            }
            function Va() {
              var t, e, n, o, u;
              return (
                (t = _a),
                (e = (function () {
                  var t, e;
                  ((t = _a),
                    (e = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'not null' === r.substr(_a, 8).toLowerCase()
                          ? ((e = r.substr(_a, 8)), (_a += 8))
                          : ((e = s), 0 === Ra && Ua(ho)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) !== s &&
                      (t, (e = { type: 'not null', value: 'not null' })));
                  return (t = e);
                })()) === s && (e = Zc()),
                e !== s &&
                  (t,
                  (u = e) && !u.value && (u.value = 'null'),
                  (e = { nullable: u })),
                (t = e) === s &&
                  ((t = _a),
                  (e = (function () {
                    var r, t;
                    ((r = _a),
                      cl() !== s && Zf() !== s
                        ? ((t = Qc()) === s && (t = ic()),
                          t !== s
                            ? (r, (r = { type: 'default', value: t }))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) !== s && (t, (e = { default_val: e })),
                  (t = e) === s &&
                    ((t = _a),
                    'auto_increment' === r.substr(_a, 14).toLowerCase()
                      ? ((e = r.substr(_a, 14)), (_a += 14))
                      : ((e = s), 0 === Ra && Ua(T)),
                    e !== s && (t, (e = { auto_increment: e.toLowerCase() })),
                    (t = e) === s &&
                      ((t = _a),
                      'unique' === r.substr(_a, 6).toLowerCase()
                        ? ((e = r.substr(_a, 6)), (_a += 6))
                        : ((e = s), 0 === Ra && Ua(I)),
                      e !== s && Zf() !== s
                        ? ('key' === r.substr(_a, 3).toLowerCase()
                            ? ((n = r.substr(_a, 3)), (_a += 3))
                            : ((n = s), 0 === Ra && Ua(_)),
                          n === s && (n = null),
                          n !== s
                            ? (t,
                              (t = e =
                                (function (r) {
                                  const t = ['unique'];
                                  return (
                                    r && t.push(r),
                                    { unique: t.join(' ').toLowerCase('') }
                                  );
                                })(n)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        'primary' === r.substr(_a, 7).toLowerCase()
                          ? ((e = r.substr(_a, 7)), (_a += 7))
                          : ((e = s), 0 === Ra && Ua(S)),
                        e === s && (e = null),
                        e !== s && Zf() !== s
                          ? ('key' === r.substr(_a, 3).toLowerCase()
                              ? ((n = r.substr(_a, 3)), (_a += 3))
                              : ((n = s), 0 === Ra && Ua(_)),
                            n !== s
                              ? (t,
                                (t = e =
                                  (function (r) {
                                    const t = [];
                                    return (
                                      r && t.push('primary'),
                                      t.push('key'),
                                      {
                                        primary_key: t
                                          .join(' ')
                                          .toLowerCase(''),
                                      }
                                    );
                                  })(e)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)),
                        t === s &&
                          ((t = _a),
                          (e = rb()) !== s && (t, (e = { comment: e })),
                          (t = e) === s &&
                            ((t = _a),
                            (e = Ka()) !== s && (t, (e = { collate: e })),
                            (t = e) === s &&
                              ((t = _a),
                              (e = (function () {
                                var t, e, n;
                                ((t = _a),
                                  'column_format' ===
                                  r.substr(_a, 13).toLowerCase()
                                    ? ((e = r.substr(_a, 13)), (_a += 13))
                                    : ((e = s), 0 === Ra && Ua(D)));
                                e !== s && Zf() !== s
                                  ? ('fixed' === r.substr(_a, 5).toLowerCase()
                                      ? ((n = r.substr(_a, 5)), (_a += 5))
                                      : ((n = s), 0 === Ra && Ua(P)),
                                    n === s &&
                                      ('dynamic' ===
                                      r.substr(_a, 7).toLowerCase()
                                        ? ((n = r.substr(_a, 7)), (_a += 7))
                                        : ((n = s), 0 === Ra && Ua(G)),
                                      n === s &&
                                        ('default' ===
                                        r.substr(_a, 7).toLowerCase()
                                          ? ((n = r.substr(_a, 7)), (_a += 7))
                                          : ((n = s), 0 === Ra && Ua(F)))),
                                    n !== s
                                      ? (t,
                                        (e = {
                                          type: 'column_format',
                                          value: n.toLowerCase(),
                                        }),
                                        (t = e))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s));
                                return t;
                              })()) !== s && (t, (e = { column_format: e })),
                              (t = e) === s &&
                                ((t = _a),
                                (e = (function () {
                                  var t, e, n;
                                  ((t = _a),
                                    'storage' === r.substr(_a, 7).toLowerCase()
                                      ? ((e = r.substr(_a, 7)), (_a += 7))
                                      : ((e = s), 0 === Ra && Ua($)));
                                  e !== s && Zf() !== s
                                    ? ('disk' === r.substr(_a, 4).toLowerCase()
                                        ? ((n = r.substr(_a, 4)), (_a += 4))
                                        : ((n = s), 0 === Ra && Ua(H)),
                                      n === s &&
                                        ('memory' ===
                                        r.substr(_a, 6).toLowerCase()
                                          ? ((n = r.substr(_a, 6)), (_a += 6))
                                          : ((n = s), 0 === Ra && Ua(Y))),
                                      n !== s
                                        ? (t,
                                          (e = {
                                            type: 'storage',
                                            value: n.toLowerCase(),
                                          }),
                                          (t = e))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s));
                                  return t;
                                })()) !== s && (t, (e = { storage: e })),
                                (t = e) === s &&
                                  ((t = _a),
                                  (e = oi()) !== s &&
                                    (t, (e = { reference_definition: e })),
                                  (t = e) === s &&
                                    ((t = _a),
                                    (e = (function () {
                                      var t, e, n, o, u, a, i, c;
                                      ((t = _a),
                                        (e = ni()) === s && (e = null));
                                      e !== s && Zf() !== s
                                        ? ('check' ===
                                          r.substr(_a, 5).toLowerCase()
                                            ? ((n = r.substr(_a, 5)), (_a += 5))
                                            : ((n = s), 0 === Ra && Ua(p)),
                                          n !== s &&
                                          Zf() !== s &&
                                          Wf() !== s &&
                                          Zf() !== s &&
                                          (o = ic()) !== s &&
                                          Zf() !== s &&
                                          Vf() !== s &&
                                          Zf() !== s
                                            ? ((u = _a),
                                              (a = Ql()) === s && (a = null),
                                              a !== s && (i = Zf()) !== s
                                                ? ('enforced' ===
                                                  r.substr(_a, 8).toLowerCase()
                                                    ? ((c = r.substr(_a, 8)),
                                                      (_a += 8))
                                                    : ((c = s),
                                                      0 === Ra && Ua(fr)),
                                                  c !== s
                                                    ? (u = a = [a, i, c])
                                                    : ((_a = u), (u = s)))
                                                : ((_a = u), (u = s)),
                                              u === s && (u = null),
                                              u !== s
                                                ? (t,
                                                  (e = (function (r, t, e, n) {
                                                    const o = [];
                                                    return (
                                                      n && o.push(n[0], n[2]),
                                                      {
                                                        constraint_type:
                                                          t.toLowerCase(),
                                                        keyword: r && r.keyword,
                                                        constraint:
                                                          r && r.constraint,
                                                        definition: [e],
                                                        enforced: o
                                                          .filter((r) => r)
                                                          .join(' ')
                                                          .toLowerCase(),
                                                        resource: 'constraint',
                                                      }
                                                    );
                                                  })(e, n, o, u)),
                                                  (t = e))
                                                : ((_a = t), (t = s)))
                                            : ((_a = t), (t = s)))
                                        : ((_a = t), (t = s));
                                      return t;
                                    })()) !== s && (t, (e = { check: e })),
                                    (t = e) === s &&
                                      ((t = _a),
                                      (e = ai()) !== s && Zf() !== s
                                        ? ((n = Of()) === s && (n = null),
                                          n !== s &&
                                          Zf() !== s &&
                                          (o = xc()) !== s
                                            ? (t,
                                              (t = e =
                                                (function (r, t, e) {
                                                  return {
                                                    character_set: {
                                                      type: r,
                                                      value: e,
                                                      symbol: t,
                                                    },
                                                  };
                                                })(e, n, o)))
                                            : ((_a = t), (t = s)))
                                        : ((_a = t), (t = s)),
                                      t === s &&
                                        ((t = _a),
                                        (e = (function () {
                                          var t, e, n, o, u, a, i, c;
                                          ((t = _a),
                                            (e = _a),
                                            (n = (function () {
                                              var t, e, n, o, u;
                                              ((t = _a),
                                                (e = _a),
                                                'generated' ===
                                                r.substr(_a, 9).toLowerCase()
                                                  ? ((n = r.substr(_a, 9)),
                                                    (_a += 9))
                                                  : ((n = s),
                                                    0 === Ra && Ua(B)));
                                              n !== s && (o = Zf()) !== s
                                                ? ('always' ===
                                                  r.substr(_a, 6).toLowerCase()
                                                    ? ((u = r.substr(_a, 6)),
                                                      (_a += 6))
                                                    : ((u = s),
                                                      0 === Ra && Ua(W)),
                                                  u !== s
                                                    ? (e = n = [n, o, u])
                                                    : ((_a = e), (e = s)))
                                                : ((_a = e), (e = s));
                                              e !== s &&
                                                (t,
                                                (e = e.join('').toLowerCase()));
                                              return (t = e);
                                            })()) === s && (n = null));
                                          n !== s && (o = Zf()) !== s
                                            ? ('as' ===
                                              r.substr(_a, 2).toLowerCase()
                                                ? ((u = r.substr(_a, 2)),
                                                  (_a += 2))
                                                : ((u = s), 0 === Ra && Ua(V)),
                                              u !== s
                                                ? (e = n = [n, o, u])
                                                : ((_a = e), (e = s)))
                                            : ((_a = e), (e = s));
                                          if (e !== s)
                                            if ((n = Zf()) !== s)
                                              if ((o = Wf()) !== s)
                                                if ((u = Zf()) !== s)
                                                  if (
                                                    ((a = Qc()) === s &&
                                                      (a = ic()),
                                                    a !== s)
                                                  )
                                                    if (Zf() !== s)
                                                      if (Vf() !== s)
                                                        if (Zf() !== s) {
                                                          for (
                                                            i = [],
                                                              'stored' ===
                                                              r
                                                                .substr(_a, 6)
                                                                .toLowerCase()
                                                                ? ((c =
                                                                    r.substr(
                                                                      _a,
                                                                      6
                                                                    )),
                                                                  (_a += 6))
                                                                : ((c = s),
                                                                  0 === Ra &&
                                                                    Ua(q)),
                                                              c === s &&
                                                                ('virtual' ===
                                                                r
                                                                  .substr(_a, 7)
                                                                  .toLowerCase()
                                                                  ? ((c =
                                                                      r.substr(
                                                                        _a,
                                                                        7
                                                                      )),
                                                                    (_a += 7))
                                                                  : ((c = s),
                                                                    0 === Ra &&
                                                                      Ua(X)));
                                                            c !== s;

                                                          )
                                                            (i.push(c),
                                                              'stored' ===
                                                              r
                                                                .substr(_a, 6)
                                                                .toLowerCase()
                                                                ? ((c =
                                                                    r.substr(
                                                                      _a,
                                                                      6
                                                                    )),
                                                                  (_a += 6))
                                                                : ((c = s),
                                                                  0 === Ra &&
                                                                    Ua(q)),
                                                              c === s &&
                                                                ('virtual' ===
                                                                r
                                                                  .substr(_a, 7)
                                                                  .toLowerCase()
                                                                  ? ((c =
                                                                      r.substr(
                                                                        _a,
                                                                        7
                                                                      )),
                                                                    (_a += 7))
                                                                  : ((c = s),
                                                                    0 === Ra &&
                                                                      Ua(X))));
                                                          i !== s
                                                            ? (t,
                                                              (l = i),
                                                              (e = {
                                                                type: 'generated',
                                                                expr: a,
                                                                value: e
                                                                  .filter(
                                                                    (r) =>
                                                                      'string' ==
                                                                      typeof r
                                                                  )
                                                                  .join(' ')
                                                                  .toLowerCase(),
                                                                storage_type:
                                                                  l &&
                                                                  l[0] &&
                                                                  l[0].toLowerCase(),
                                                              }),
                                                              (t = e))
                                                            : ((_a = t),
                                                              (t = s));
                                                        } else
                                                          ((_a = t), (t = s));
                                                      else ((_a = t), (t = s));
                                                    else ((_a = t), (t = s));
                                                  else ((_a = t), (t = s));
                                                else ((_a = t), (t = s));
                                              else ((_a = t), (t = s));
                                            else ((_a = t), (t = s));
                                          else ((_a = t), (t = s));
                                          var l;
                                          return t;
                                        })()) !== s &&
                                          (t, (e = { generated: e })),
                                        (t = e))))))))))))),
                t
              );
            }
            function qa() {
              var r, t, e, n, o, u, a;
              return (
                (r = _a),
                (t = Tc()) !== s && Zf() !== s && (e = yb()) !== s && Zf() !== s
                  ? ((n = (function () {
                      var r, t, e, n, o, u;
                      if (((r = _a), (t = Va()) !== s))
                        if (Zf() !== s) {
                          for (
                            e = [],
                              n = _a,
                              (o = Zf()) !== s && (u = Va()) !== s
                                ? (n = o = [o, u])
                                : ((_a = n), (n = s));
                            n !== s;

                          )
                            (e.push(n),
                              (n = _a),
                              (o = Zf()) !== s && (u = Va()) !== s
                                ? (n = o = [o, u])
                                : ((_a = n), (n = s)));
                          e !== s
                            ? (r,
                              (r = t =
                                (function (r, t) {
                                  let e = r;
                                  for (let r = 0; r < t.length; r++)
                                    e = { ...e, ...t[r][1] };
                                  return e;
                                })(t, e)))
                            : ((_a = r), (r = s));
                        } else ((_a = r), (r = s));
                      else ((_a = r), (r = s));
                      return r;
                    })()) === s && (n = null),
                    n !== s
                      ? (r,
                        (o = t),
                        (u = e),
                        (a = n),
                        Rb.add(`create::${o.table}::${o.column}`),
                        (r = t =
                          {
                            column: o,
                            definition: u,
                            resource: 'column',
                            ...(a || {}),
                          }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Xa() {
              var t, e, n, o, u;
              return (
                (t = _a),
                'definer' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(m)),
                e !== s &&
                Zf() !== s &&
                Of() !== s &&
                Zf() !== s &&
                (n = zc()) !== s &&
                Zf() !== s
                  ? (64 === r.charCodeAt(_a)
                      ? ((o = '@'), _a++)
                      : ((o = s), 0 === Ra && Ua(N)),
                    o !== s && Zf() !== s && (u = zc()) !== s
                      ? (t,
                        (t = e =
                          (function (r, t) {
                            const e =
                                'single_quote_string' === r.type ? "'" : '"',
                              n = 'single_quote_string' === t.type ? "'" : '"';
                            return `DEFINER = ${e}${r.value}${e}@${n}${t.value}${n}`;
                          })(n, u)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  'definer' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(m)),
                  e !== s &&
                  Zf() !== s &&
                  Of() !== s &&
                  Zf() !== s &&
                  (n = _f()) !== s &&
                  Zf() !== s &&
                  (o = Wf()) !== s &&
                  Zf() !== s &&
                  (u = Vf()) !== s
                    ? (t, (t = e = 'DEFINER = CURRENT_USER()'))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    'definer' === r.substr(_a, 7).toLowerCase()
                      ? ((e = r.substr(_a, 7)), (_a += 7))
                      : ((e = s), 0 === Ra && Ua(m)),
                    e !== s &&
                    Zf() !== s &&
                    Of() !== s &&
                    Zf() !== s &&
                    (n = _f()) !== s
                      ? (t, (t = e = 'DEFINER = CURRENT_USER'))
                      : ((_a = t), (t = s)))),
                t
              );
            }
            function Ka() {
              var t, e, n;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'collate' === r.substr(_a, 7).toLowerCase()
                      ? ((e = r.substr(_a, 7)), (_a += 7))
                      : ((e = s), 0 === Ra && Ua(Ar)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t, (t = e = 'COLLATE')) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s && Zf() !== s
                  ? ((e = Of()) === s && (e = null),
                    e !== s && Zf() !== s && (n = xc()) !== s
                      ? (t, (t = { type: 'collate', symbol: e, value: n }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Qa() {
              var t, e, n;
              return (
                (t = _a),
                'if' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(K)),
                e !== s && Zf() !== s
                  ? ('exists' === r.substr(_a, 6).toLowerCase()
                      ? ((n = r.substr(_a, 6)), (_a += 6))
                      : ((n = s), 0 === Ra && Ua(Q)),
                    n !== s ? (t, (t = e = 'if exists')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Za() {
              var t, e, n;
              return (
                (t = (function () {
                  var r, t;
                  ((r = _a),
                    xf() !== s && Zf() !== s && (t = ei()) !== s
                      ? (r,
                        (r = {
                          action: 'add',
                          create_definitions: t,
                          resource: 'constraint',
                          type: 'alter',
                        }))
                      : ((_a = r), (r = s)));
                  return r;
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      (e = bl()) !== s && Zf() !== s
                        ? ('check' === r.substr(_a, 5).toLowerCase()
                            ? ((n = r.substr(_a, 5)), (_a += 5))
                            : ((n = s), 0 === Ra && Ua(p)),
                          n !== s && Zf() !== s && (o = xc()) !== s
                            ? (t,
                              (e = {
                                action: 'drop',
                                constraint: o,
                                keyword: n.toLowerCase(),
                                resource: 'constraint',
                                type: 'alter',
                              }),
                              (t = e))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u;
                    ((t = _a),
                      (e = bl()) !== s && Zf() !== s
                        ? ('primary' === r.substr(_a, 7).toLowerCase()
                            ? ((n = r.substr(_a, 7)), (_a += 7))
                            : ((n = s), 0 === Ra && Ua(S)),
                          n !== s && Zf() !== s && (o = Uf()) !== s
                            ? (t,
                              (t = e =
                                {
                                  action: 'drop',
                                  key: '',
                                  keyword: 'primary key',
                                  resource: 'key',
                                  type: 'alter',
                                }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    t === s &&
                      ((t = _a),
                      (e = bl()) !== s && Zf() !== s
                        ? ('foreign' === r.substr(_a, 7).toLowerCase()
                            ? ((n = r.substr(_a, 7)), (_a += 7))
                            : ((n = s), 0 === Ra && Ua(ur)),
                          n !== s &&
                          Zf() !== s &&
                          (o = Uf()) !== s &&
                          Zf() !== s &&
                          (u = xc()) !== s
                            ? (t,
                              (t = e =
                                {
                                  action: 'drop',
                                  key: u,
                                  keyword: 'foreign key',
                                  resource: 'key',
                                  type: 'alter',
                                }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = bl()) !== s && Zf() !== s
                          ? ((n = Uf()) === s && (n = kf()),
                            n !== s && Zf() !== s && (o = xc()) !== s
                              ? (t,
                                (e = (function (r) {
                                  return {
                                    action: 'drop',
                                    index: r,
                                    keyword: 'index',
                                    resource: 'index',
                                    type: 'alter',
                                  };
                                })(o)),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s))));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      Pl() !== s && Zf() !== s
                        ? ('check' === r.substr(_a, 5).toLowerCase()
                            ? ((e = r.substr(_a, 5)), (_a += 5))
                            : ((e = s), 0 === Ra && Ua(p)),
                          e !== s && Zf() !== s
                            ? ('check' === r.substr(_a, 5).toLowerCase()
                                ? ((n = r.substr(_a, 5)), (_a += 5))
                                : ((n = s), 0 === Ra && Ua(p)),
                              n !== s &&
                              Zf() !== s &&
                              Ff() !== s &&
                              Zf() !== s &&
                              (o = xc()) !== s
                                ? (t,
                                  (t = {
                                    action: 'with',
                                    constraint: o,
                                    keyword: 'check check',
                                    resource: 'constraint',
                                    type: 'alter',
                                  }))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      'nocheck' === r.substr(_a, 7).toLowerCase()
                        ? ((e = r.substr(_a, 7)), (_a += 7))
                        : ((e = s), 0 === Ra && Ua(ar)));
                    e !== s &&
                    Zf() !== s &&
                    Ff() !== s &&
                    Zf() !== s &&
                    (n = xc()) !== s
                      ? (t,
                        (t = e =
                          {
                            action: 'nocheck',
                            constraint: n,
                            resource: 'constraint',
                            type: 'alter',
                          }))
                      : ((_a = t), (t = s));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n;
                    ((r = _a),
                      (t = xf()) !== s &&
                      Zf() !== s &&
                      (e = jf()) !== s &&
                      Zf() !== s &&
                      (n = qa()) !== s
                        ? (r,
                          (o = e),
                          (u = n),
                          (t = {
                            action: 'add',
                            ...u,
                            keyword: o,
                            resource: 'column',
                            type: 'alter',
                          }),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var o, u;
                    r === s &&
                      ((r = _a),
                      (t = xf()) !== s && Zf() !== s && (e = qa()) !== s
                        ? (r,
                          (t = (function (r) {
                            return {
                              action: 'add',
                              ...r,
                              resource: 'column',
                              type: 'alter',
                            };
                          })(e)),
                          (r = t))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n;
                    ((r = _a),
                      (t = bl()) !== s &&
                      Zf() !== s &&
                      (e = jf()) !== s &&
                      Zf() !== s &&
                      (n = Tc()) !== s
                        ? (r,
                          (r = t =
                            {
                              action: 'drop',
                              column: n,
                              keyword: e,
                              resource: 'column',
                              type: 'alter',
                            }))
                        : ((_a = r), (r = s)));
                    r === s &&
                      ((r = _a),
                      (t = bl()) !== s && Zf() !== s && (e = Tc()) !== s
                        ? (r,
                          (t = (function (r) {
                            return {
                              action: 'drop',
                              column: r,
                              resource: 'column',
                              type: 'alter',
                            };
                          })(e)),
                          (r = t))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'modify' === r.substr(_a, 6).toLowerCase()
                            ? ((e = r.substr(_a, 6)), (_a += 6))
                            : ((e = s), 0 === Ra && Ua(Yu)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s
                              ? (t, (t = e = 'MODIFY'))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      (n = qa()) !== s
                        ? (t,
                          (o = n),
                          (e = {
                            action: 'modify',
                            ...o,
                            resource: 'column',
                            type: 'alter',
                          }),
                          (t = e))
                        : ((_a = t), (t = s)));
                    var o;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e;
                    ((r = _a),
                      (t = xf()) !== s && Zf() !== s && (e = ri()) !== s
                        ? (r,
                          (n = e),
                          (t = { action: 'add', type: 'alter', ...n }),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var n;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e;
                    ((r = _a),
                      (t = xf()) !== s && Zf() !== s && (e = ti()) !== s
                        ? (r,
                          (n = e),
                          (t = { action: 'add', type: 'alter', ...n }),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var n;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n, o;
                    ((r = _a),
                      (t = ml()) !== s &&
                      Zf() !== s &&
                      jf() !== s &&
                      Zf() !== s &&
                      (e = Tc()) !== s &&
                      Zf() !== s
                        ? ((n = ll()) === s && (n = Sl()),
                          n === s && (n = null),
                          n !== s && Zf() !== s && (o = Tc()) !== s
                            ? (r,
                              (a = o),
                              (t = {
                                action: 'rename',
                                type: 'alter',
                                resource: 'column',
                                keyword: 'column',
                                old_column: e,
                                prefix: (u = n) && u[0].toLowerCase(),
                                column: a,
                              }),
                              (r = t))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    var u, a;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n;
                    ((r = _a),
                      (t = ml()) !== s && Zf() !== s
                        ? ((e = ll()) === s && (e = Sl()),
                          e === s && (e = null),
                          e !== s && Zf() !== s && (n = _c()) !== s
                            ? (r,
                              (u = n),
                              (t = {
                                action: 'rename',
                                type: 'alter',
                                resource: 'table',
                                keyword: (o = e) && o[0].toLowerCase(),
                                table: u,
                              }),
                              (r = t))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)));
                    var o, u;
                    return r;
                  })()) === s &&
                  (t = za()) === s &&
                  (t = Ja()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a, i, c, l;
                    ((t = _a),
                      'change' === r.substr(_a, 6).toLowerCase()
                        ? ((e = r.substr(_a, 6)), (_a += 6))
                        : ((e = s), 0 === Ra && Ua(or)));
                    e !== s && Zf() !== s
                      ? ((n = jf()) === s && (n = null),
                        n !== s &&
                        Zf() !== s &&
                        (o = Tc()) !== s &&
                        Zf() !== s &&
                        (u = qa()) !== s &&
                        Zf() !== s
                          ? ((a = _a),
                            'first' === r.substr(_a, 5).toLowerCase()
                              ? ((i = r.substr(_a, 5)), (_a += 5))
                              : ((i = s), 0 === Ra && Ua(sr)),
                            i === s &&
                              ('after' === r.substr(_a, 5).toLowerCase()
                                ? ((i = r.substr(_a, 5)), (_a += 5))
                                : ((i = s), 0 === Ra && Ua(R))),
                            i !== s && (c = Zf()) !== s && (l = Tc()) !== s
                              ? (a = i = [i, c, l])
                              : ((_a = a), (a = s)),
                            a === s && (a = null),
                            a !== s
                              ? (t,
                                (f = n),
                                (b = u),
                                (p = a),
                                (e = {
                                  action: 'change',
                                  old_column: o,
                                  ...b,
                                  keyword: f,
                                  resource: 'column',
                                  type: 'alter',
                                  first_after: p && {
                                    keyword: p[0],
                                    column: p[2],
                                  },
                                }),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    var f, b, p;
                    return t;
                  })()) === s &&
                  ((t = _a),
                  (e = ci()) !== s &&
                    (t,
                    ((n = e).resource = n.keyword),
                    (n[n.keyword] = n.value),
                    delete n.value,
                    (e = { type: 'alter', ...n })),
                  (t = e)),
                t
              );
            }
            function za() {
              var t, e, n, o;
              return (
                (t = _a),
                'algorithm' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(d)),
                e !== s && Zf() !== s
                  ? ((n = Of()) === s && (n = null),
                    n !== s && Zf() !== s
                      ? ('default' === r.substr(_a, 7).toLowerCase()
                          ? ((o = r.substr(_a, 7)), (_a += 7))
                          : ((o = s), 0 === Ra && Ua(F)),
                        o === s &&
                          ('instant' === r.substr(_a, 7).toLowerCase()
                            ? ((o = r.substr(_a, 7)), (_a += 7))
                            : ((o = s), 0 === Ra && Ua(Z)),
                          o === s &&
                            ('inplace' === r.substr(_a, 7).toLowerCase()
                              ? ((o = r.substr(_a, 7)), (_a += 7))
                              : ((o = s), 0 === Ra && Ua(z)),
                            o === s &&
                              ('copy' === r.substr(_a, 4).toLowerCase()
                                ? ((o = r.substr(_a, 4)), (_a += 4))
                                : ((o = s), 0 === Ra && Ua(J))))),
                        o !== s
                          ? (t,
                            (t = e =
                              {
                                type: 'alter',
                                keyword: 'algorithm',
                                resource: 'algorithm',
                                symbol: n,
                                algorithm: o,
                              }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ja() {
              var t, e, n, o;
              return (
                (t = _a),
                'lock' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(rr)),
                e !== s && Zf() !== s
                  ? ((n = Of()) === s && (n = null),
                    n !== s && Zf() !== s
                      ? ('default' === r.substr(_a, 7).toLowerCase()
                          ? ((o = r.substr(_a, 7)), (_a += 7))
                          : ((o = s), 0 === Ra && Ua(F)),
                        o === s &&
                          ('none' === r.substr(_a, 4).toLowerCase()
                            ? ((o = r.substr(_a, 4)), (_a += 4))
                            : ((o = s), 0 === Ra && Ua(tr)),
                          o === s &&
                            ('shared' === r.substr(_a, 6).toLowerCase()
                              ? ((o = r.substr(_a, 6)), (_a += 6))
                              : ((o = s), 0 === Ra && Ua(er)),
                            o === s &&
                              ('exclusive' === r.substr(_a, 9).toLowerCase()
                                ? ((o = r.substr(_a, 9)), (_a += 9))
                                : ((o = s), 0 === Ra && Ua(nr))))),
                        o !== s
                          ? (t,
                            (t = e =
                              {
                                type: 'alter',
                                keyword: 'lock',
                                resource: 'lock',
                                symbol: n,
                                lock: o,
                              }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ri() {
              var r, t, e, n, o, u, a, i;
              return (
                (r = _a),
                (t = kf()) === s && (t = Uf()),
                t !== s && Zf() !== s
                  ? ((e = Rc()) === s && (e = null),
                    e !== s && Zf() !== s
                      ? ((n = xi()) === s && (n = null),
                        n !== s && Zf() !== s && (o = mi()) !== s && Zf() !== s
                          ? ((u = ji()) === s && (u = null),
                            u !== s && Zf() !== s
                              ? (r,
                                (a = n),
                                (i = u),
                                (r = t =
                                  {
                                    index: e,
                                    definition: o,
                                    keyword: t.toLowerCase(),
                                    index_type: a,
                                    resource: 'index',
                                    index_options: i,
                                  }))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function ti() {
              var r, t, e, n, o, u, a, i, c;
              return (
                (r = _a),
                (t = Mf()) === s && (t = Df()),
                t !== s && Zf() !== s
                  ? ((e = kf()) === s && (e = Uf()),
                    e === s && (e = null),
                    e !== s && Zf() !== s
                      ? ((n = Rc()) === s && (n = null),
                        n !== s && Zf() !== s && (o = Ci()) !== s && Zf() !== s
                          ? ((u = ji()) === s && (u = null),
                            u !== s
                              ? (r,
                                (a = t),
                                (c = u),
                                (r = t =
                                  {
                                    index: n,
                                    definition: o,
                                    keyword:
                                      ((i = e) &&
                                        `${a.toLowerCase()} ${i.toLowerCase()}`) ||
                                      a.toLowerCase(),
                                    index_options: c,
                                    resource: 'index',
                                  }))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function ei() {
              var t;
              return (
                (t = (function () {
                  var t, e, n, o, u, a, i, c;
                  ((t = _a), (e = ni()) === s && (e = null));
                  e !== s && Zf() !== s
                    ? ((n = _a),
                      'primary' === r.substr(_a, 7).toLowerCase()
                        ? ((o = r.substr(_a, 7)), (_a += 7))
                        : ((o = s), 0 === Ra && Ua(S)),
                      o !== s && (u = Zf()) !== s
                        ? ('key' === r.substr(_a, 3).toLowerCase()
                            ? ((a = r.substr(_a, 3)), (_a += 3))
                            : ((a = s), 0 === Ra && Ua(_)),
                          a !== s ? (n = o = [o, u, a]) : ((_a = n), (n = s)))
                        : ((_a = n), (n = s)),
                      n !== s && (o = Zf()) !== s
                        ? ((u = xi()) === s && (u = null),
                          u !== s &&
                          (a = Zf()) !== s &&
                          (i = mi()) !== s &&
                          Zf() !== s
                            ? ((c = ji()) === s && (c = null),
                              c !== s
                                ? (t,
                                  (f = n),
                                  (b = u),
                                  (p = i),
                                  (v = c),
                                  (e = {
                                    constraint: (l = e) && l.constraint,
                                    definition: p,
                                    constraint_type: `${f[0].toLowerCase()} ${f[2].toLowerCase()}`,
                                    keyword: l && l.keyword,
                                    index_type: b,
                                    resource: 'constraint',
                                    index_options: v,
                                  }),
                                  (t = e))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  var l, f, b, p, v;
                  return t;
                })()) === s &&
                  (t = (function () {
                    var r, t, e, n, o, u, a, i;
                    ((r = _a), (t = ni()) === s && (t = null));
                    t !== s && Zf() !== s && (e = Pf()) !== s && Zf() !== s
                      ? ((n = kf()) === s && (n = Uf()),
                        n === s && (n = null),
                        n !== s && Zf() !== s
                          ? ((o = Rc()) === s && (o = null),
                            o !== s && Zf() !== s
                              ? ((u = xi()) === s && (u = null),
                                u !== s &&
                                Zf() !== s &&
                                (a = mi()) !== s &&
                                Zf() !== s
                                  ? ((i = ji()) === s && (i = null),
                                    i !== s
                                      ? (r,
                                        (l = e),
                                        (f = n),
                                        (b = o),
                                        (p = u),
                                        (v = a),
                                        (d = i),
                                        (t = {
                                          constraint: (c = t) && c.constraint,
                                          definition: v,
                                          constraint_type:
                                            (f &&
                                              `${l.toLowerCase()} ${f.toLowerCase()}`) ||
                                            l.toLowerCase(),
                                          keyword: c && c.keyword,
                                          index_type: p,
                                          index: b,
                                          resource: 'constraint',
                                          index_options: d,
                                        }),
                                        (r = t))
                                      : ((_a = r), (r = s)))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s));
                    var c, l, f, b, p, v, d;
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a;
                    ((t = _a), (e = ni()) === s && (e = null));
                    e !== s && Zf() !== s
                      ? ('foreign key' === r.substr(_a, 11).toLowerCase()
                          ? ((n = r.substr(_a, 11)), (_a += 11))
                          : ((n = s), 0 === Ra && Ua(lr)),
                        n !== s && Zf() !== s
                          ? ((o = Rc()) === s && (o = null),
                            o !== s &&
                            Zf() !== s &&
                            (u = Ci()) !== s &&
                            Zf() !== s
                              ? ((a = oi()) === s && (a = null),
                                a !== s
                                  ? (t,
                                    (c = n),
                                    (l = o),
                                    (f = u),
                                    (b = a),
                                    (e = {
                                      constraint: (i = e) && i.constraint,
                                      definition: f,
                                      constraint_type: c,
                                      keyword: i && i.keyword,
                                      index: l,
                                      resource: 'constraint',
                                      reference_definition: b,
                                    }),
                                    (t = e))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    var i, c, l, f, b;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a, i, c, l, f;
                    ((t = _a), (e = ni()) === s && (e = null));
                    e !== s && Zf() !== s
                      ? ('check' === r.substr(_a, 5).toLowerCase()
                          ? ((n = r.substr(_a, 5)), (_a += 5))
                          : ((n = s), 0 === Ra && Ua(p)),
                        n !== s && Zf() !== s
                          ? ((o = _a),
                            'not' === r.substr(_a, 3).toLowerCase()
                              ? ((u = r.substr(_a, 3)), (_a += 3))
                              : ((u = s), 0 === Ra && Ua(ir)),
                            u !== s && (a = Zf()) !== s
                              ? ('for' === r.substr(_a, 3).toLowerCase()
                                  ? ((i = r.substr(_a, 3)), (_a += 3))
                                  : ((i = s), 0 === Ra && Ua(O)),
                                i !== s && (c = Zf()) !== s
                                  ? ('replication' ===
                                    r.substr(_a, 11).toLowerCase()
                                      ? ((l = r.substr(_a, 11)), (_a += 11))
                                      : ((l = s), 0 === Ra && Ua(cr)),
                                    l !== s && (f = Zf()) !== s
                                      ? (o = u = [u, a, i, c, l, f])
                                      : ((_a = o), (o = s)))
                                  : ((_a = o), (o = s)))
                              : ((_a = o), (o = s)),
                            o === s && (o = null),
                            o !== s &&
                            (u = Wf()) !== s &&
                            (a = Zf()) !== s &&
                            (i = ic()) !== s &&
                            (c = Zf()) !== s &&
                            (l = Vf()) !== s
                              ? (t,
                                (b = e),
                                (v = o),
                                (d = i),
                                (e = {
                                  constraint_type: n.toLowerCase(),
                                  keyword: b && b.keyword,
                                  constraint: b && b.constraint,
                                  index_type: v && {
                                    keyword: 'not for replication',
                                  },
                                  definition: [d],
                                  resource: 'constraint',
                                }),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    var b, v, d;
                    return t;
                  })()),
                t
              );
            }
            function ni() {
              var r, t, e, n;
              return (
                (r = _a),
                (t = Ff()) !== s && Zf() !== s
                  ? ((e = _c()) === s && (e = null),
                    e !== s
                      ? (r,
                        (n = e),
                        (r = t = { keyword: t.toLowerCase(), constraint: n }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function oi() {
              var t, e, n, o, u, a, i, c, l, f;
              return (
                (t = _a),
                (e = $f()) !== s &&
                Zf() !== s &&
                (n = Ui()) !== s &&
                Zf() !== s &&
                (o = Ci()) !== s &&
                Zf() !== s
                  ? ('match full' === r.substr(_a, 10).toLowerCase()
                      ? ((u = r.substr(_a, 10)), (_a += 10))
                      : ((u = s), 0 === Ra && Ua(br)),
                    u === s &&
                      ('match partial' === r.substr(_a, 13).toLowerCase()
                        ? ((u = r.substr(_a, 13)), (_a += 13))
                        : ((u = s), 0 === Ra && Ua(pr)),
                      u === s &&
                        ('match simple' === r.substr(_a, 12).toLowerCase()
                          ? ((u = r.substr(_a, 12)), (_a += 12))
                          : ((u = s), 0 === Ra && Ua(vr)))),
                    u === s && (u = null),
                    u !== s && Zf() !== s
                      ? ((a = si()) === s && (a = null),
                        a !== s && Zf() !== s
                          ? ((i = si()) === s && (i = null),
                            i !== s
                              ? (t,
                                (c = u),
                                (l = a),
                                (f = i),
                                (t = e =
                                  {
                                    definition: o,
                                    table: n,
                                    keyword: e.toLowerCase(),
                                    match: c && c.toLowerCase(),
                                    on_action: [l, f].filter((r) => r),
                                  }))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = si()) !== s && (t, (e = { on_action: [e] })),
                  (t = e)),
                t
              );
            }
            function si() {
              var t, e, n, o;
              return (
                (t = _a),
                jl() !== s && Zf() !== s
                  ? ((e = Ll()) === s && (e = dl()),
                    e !== s &&
                    Zf() !== s &&
                    (n = (function () {
                      var t, e, n;
                      ((t = _a),
                        (e = If()) !== s &&
                        Zf() !== s &&
                        Wf() !== s &&
                        Zf() !== s
                          ? ((n = ec()) === s && (n = null),
                            n !== s && Zf() !== s && Vf() !== s
                              ? (t,
                                (t = e =
                                  { type: 'function', name: e, args: n }))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)));
                      t === s &&
                        ((t = _a),
                        (e = ui()) === s &&
                          ('set null' === r.substr(_a, 8).toLowerCase()
                            ? ((e = r.substr(_a, 8)), (_a += 8))
                            : ((e = s), 0 === Ra && Ua(wr)),
                          e === s &&
                            ('no action' === r.substr(_a, 9).toLowerCase()
                              ? ((e = r.substr(_a, 9)), (_a += 9))
                              : ((e = s), 0 === Ra && Ua(Lr)),
                            e === s &&
                              ('set default' === r.substr(_a, 11).toLowerCase()
                                ? ((e = r.substr(_a, 11)), (_a += 11))
                                : ((e = s), 0 === Ra && Ua(Cr)),
                              e === s && (e = If())))),
                        e !== s &&
                          (t, (e = { type: 'origin', value: e.toLowerCase() })),
                        (t = e));
                      return t;
                    })()) !== s
                      ? (t,
                        (o = n),
                        (t = { type: 'on ' + e[0].toLowerCase(), value: o }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ui() {
              var t, e;
              return (
                (t = _a),
                'restrict' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(dr)),
                e === s &&
                  ('cascade' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(yr))),
                e !== s && (t, (e = e.toLowerCase())),
                (t = e)
              );
            }
            function ai() {
              var t, e, n;
              return (
                (t = _a),
                'character' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(hr)),
                e !== s && Zf() !== s
                  ? ('set' === r.substr(_a, 3).toLowerCase()
                      ? ((n = r.substr(_a, 3)), (_a += 3))
                      : ((n = s), 0 === Ra && Ua(mr)),
                    n !== s
                      ? (t, (t = e = 'CHARACTER SET'))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ii() {
              var t, e, n, o, u, a, i, c, l;
              return (
                (t = _a),
                (e = cl()) === s && (e = null),
                e !== s && Zf() !== s
                  ? ((n = ai()) === s &&
                      ('charset' === r.substr(_a, 7).toLowerCase()
                        ? ((n = r.substr(_a, 7)), (_a += 7))
                        : ((n = s), 0 === Ra && Ua(Er)),
                      n === s &&
                        ('collate' === r.substr(_a, 7).toLowerCase()
                          ? ((n = r.substr(_a, 7)), (_a += 7))
                          : ((n = s), 0 === Ra && Ua(Ar)))),
                    n !== s && Zf() !== s
                      ? ((o = Of()) === s && (o = null),
                        o !== s && Zf() !== s && (u = xc()) !== s
                          ? (t,
                            (i = n),
                            (c = o),
                            (l = u),
                            (t = e =
                              {
                                keyword:
                                  ((a = e) &&
                                    `${a[0].toLowerCase()} ${i.toLowerCase()}`) ||
                                  i.toLowerCase(),
                                symbol: c,
                                value: l,
                              }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ci() {
              var t, e, n, o, u, a, i, c, l;
              return (
                (t = _a),
                'auto_increment' === r.substr(_a, 14).toLowerCase()
                  ? ((e = r.substr(_a, 14)), (_a += 14))
                  : ((e = s), 0 === Ra && Ua(T)),
                e === s &&
                  ('avg_row_length' === r.substr(_a, 14).toLowerCase()
                    ? ((e = r.substr(_a, 14)), (_a += 14))
                    : ((e = s), 0 === Ra && Ua(Tr)),
                  e === s &&
                    ('key_block_size' === r.substr(_a, 14).toLowerCase()
                      ? ((e = r.substr(_a, 14)), (_a += 14))
                      : ((e = s), 0 === Ra && Ua(Ir)),
                    e === s &&
                      ('max_rows' === r.substr(_a, 8).toLowerCase()
                        ? ((e = r.substr(_a, 8)), (_a += 8))
                        : ((e = s), 0 === Ra && Ua(_r)),
                      e === s &&
                        ('min_rows' === r.substr(_a, 8).toLowerCase()
                          ? ((e = r.substr(_a, 8)), (_a += 8))
                          : ((e = s), 0 === Ra && Ua(Sr)),
                        e === s &&
                          ('stats_sample_pages' ===
                          r.substr(_a, 18).toLowerCase()
                            ? ((e = r.substr(_a, 18)), (_a += 18))
                            : ((e = s), 0 === Ra && Ua(Nr))))))),
                e !== s && Zf() !== s
                  ? ((n = Of()) === s && (n = null),
                    n !== s && Zf() !== s && (o = el()) !== s
                      ? (t,
                        (c = n),
                        (l = o),
                        (t = e =
                          {
                            keyword: e.toLowerCase(),
                            symbol: c,
                            value: l.value,
                          }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  'CHECKSUM' === r.substr(_a, 8)
                    ? ((e = 'CHECKSUM'), (_a += 8))
                    : ((e = s), 0 === Ra && Ua(gr)),
                  e === s &&
                    ('DELAY_KEY_WRITE' === r.substr(_a, 15)
                      ? ((e = 'DELAY_KEY_WRITE'), (_a += 15))
                      : ((e = s), 0 === Ra && Ua(Rr))),
                  e !== s && Zf() !== s && (n = Of()) !== s && Zf() !== s
                    ? (Or.test(r.charAt(_a))
                        ? ((o = r.charAt(_a)), _a++)
                        : ((o = s), 0 === Ra && Ua(xr)),
                      o !== s
                        ? (t,
                          (t = e =
                            (function (r, t, e) {
                              return {
                                keyword: r.toLowerCase(),
                                symbol: t,
                                value: e,
                              };
                            })(e, n, o)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s &&
                    (t = ii()) === s &&
                    ((t = _a),
                    (e = Gf()) === s &&
                      ('connection' === r.substr(_a, 10).toLowerCase()
                        ? ((e = r.substr(_a, 10)), (_a += 10))
                        : ((e = s), 0 === Ra && Ua(jr))),
                    e !== s && Zf() !== s
                      ? ((n = Of()) === s && (n = null),
                        n !== s && Zf() !== s && (o = zc()) !== s
                          ? (t,
                            (t = e =
                              (function (r, t, e) {
                                return {
                                  keyword: r.toLowerCase(),
                                  symbol: t,
                                  value: `'${e.value}'`,
                                };
                              })(e, n, o)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      'compression' === r.substr(_a, 11).toLowerCase()
                        ? ((e = r.substr(_a, 11)), (_a += 11))
                        : ((e = s), 0 === Ra && Ua(kr)),
                      e !== s && Zf() !== s
                        ? ((n = Of()) === s && (n = null),
                          n !== s && Zf() !== s
                            ? ((o = _a),
                              39 === r.charCodeAt(_a)
                                ? ((u = "'"), _a++)
                                : ((u = s), 0 === Ra && Ua(Ur)),
                              u !== s
                                ? ('zlib' === r.substr(_a, 4).toLowerCase()
                                    ? ((a = r.substr(_a, 4)), (_a += 4))
                                    : ((a = s), 0 === Ra && Ua(Mr)),
                                  a === s &&
                                    ('lz4' === r.substr(_a, 3).toLowerCase()
                                      ? ((a = r.substr(_a, 3)), (_a += 3))
                                      : ((a = s), 0 === Ra && Ua(Dr)),
                                    a === s &&
                                      ('none' === r.substr(_a, 4).toLowerCase()
                                        ? ((a = r.substr(_a, 4)), (_a += 4))
                                        : ((a = s), 0 === Ra && Ua(tr)))),
                                  a !== s
                                    ? (39 === r.charCodeAt(_a)
                                        ? ((i = "'"), _a++)
                                        : ((i = s), 0 === Ra && Ua(Ur)),
                                      i !== s
                                        ? (o = u = [u, a, i])
                                        : ((_a = o), (o = s)))
                                    : ((_a = o), (o = s)))
                                : ((_a = o), (o = s)),
                              o !== s
                                ? (t,
                                  (t = e =
                                    (function (r, t, e) {
                                      return {
                                        keyword: r.toLowerCase(),
                                        symbol: t,
                                        value: e.join('').toUpperCase(),
                                      };
                                    })(e, n, o)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        'engine' === r.substr(_a, 6).toLowerCase()
                          ? ((e = r.substr(_a, 6)), (_a += 6))
                          : ((e = s), 0 === Ra && Ua(Pr)),
                        e !== s && Zf() !== s
                          ? ((n = Of()) === s && (n = null),
                            n !== s && Zf() !== s && (o = xc()) !== s
                              ? (t, (t = e = Gr(e, n, o)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)),
                        t === s &&
                          ((t = _a),
                          'row_format' === r.substr(_a, 10).toLowerCase()
                            ? ((e = r.substr(_a, 10)), (_a += 10))
                            : ((e = s), 0 === Ra && Ua(Fr)),
                          e !== s && Zf() !== s
                            ? ((n = Of()) === s && (n = null),
                              n !== s && Zf() !== s
                                ? ((o = cl()) === s &&
                                    ('dynamic' === r.substr(_a, 7).toLowerCase()
                                      ? ((o = r.substr(_a, 7)), (_a += 7))
                                      : ((o = s), 0 === Ra && Ua(G)),
                                    o === s &&
                                      ('fixed' === r.substr(_a, 5).toLowerCase()
                                        ? ((o = r.substr(_a, 5)), (_a += 5))
                                        : ((o = s), 0 === Ra && Ua(P)),
                                      o === s &&
                                        ('compressed' ===
                                        r.substr(_a, 10).toLowerCase()
                                          ? ((o = r.substr(_a, 10)), (_a += 10))
                                          : ((o = s), 0 === Ra && Ua($r)),
                                        o === s &&
                                          ('redundant' ===
                                          r.substr(_a, 9).toLowerCase()
                                            ? ((o = r.substr(_a, 9)), (_a += 9))
                                            : ((o = s), 0 === Ra && Ua(Hr)),
                                          o === s &&
                                            ('compact' ===
                                            r.substr(_a, 7).toLowerCase()
                                              ? ((o = r.substr(_a, 7)),
                                                (_a += 7))
                                              : ((o = s),
                                                0 === Ra && Ua(Yr))))))),
                                  o !== s
                                    ? (t, (t = e = Gr(e, n, o)))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s))))))),
                t
              );
            }
            function li() {
              var t, e, n, o, u;
              return (
                (t = _a),
                (e = Di()) !== s &&
                Zf() !== s &&
                (n = (function () {
                  var t, e, n;
                  return (
                    (t = _a),
                    'read' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Br)),
                    e !== s && Zf() !== s
                      ? ('local' === r.substr(_a, 5).toLowerCase()
                          ? ((n = r.substr(_a, 5)), (_a += 5))
                          : ((n = s), 0 === Ra && Ua(b)),
                        n === s && (n = null),
                        n !== s
                          ? (t,
                            (t = e = { type: 'read', suffix: n && 'local' }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      'low_priority' === r.substr(_a, 12).toLowerCase()
                        ? ((e = r.substr(_a, 12)), (_a += 12))
                        : ((e = s), 0 === Ra && Ua(Wr)),
                      e === s && (e = null),
                      e !== s && Zf() !== s
                        ? ('write' === r.substr(_a, 5).toLowerCase()
                            ? ((n = r.substr(_a, 5)), (_a += 5))
                            : ((n = s), 0 === Ra && Ua(Vr)),
                          n !== s
                            ? (t,
                              (t = e =
                                { type: 'write', prefix: e && 'low_priority' }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s))),
                    t
                  );
                })()) !== s
                  ? (t,
                    (o = e),
                    (u = n),
                    gb.add(`lock::${o.db}::${o.table}`),
                    (t = e = { table: o, lock_type: u }))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function fi() {
              var t;
              return (
                (t = (function () {
                  var t, e, n, o, u;
                  return (
                    (t = _a),
                    (e = Yl()) === s &&
                      (e = pl()) === s &&
                      ((e = _a),
                      (n = yl()) !== s && (o = Zf()) !== s
                        ? ('view' === r.substr(_a, 4).toLowerCase()
                            ? ((u = r.substr(_a, 4)), (_a += 4))
                            : ((u = s), 0 === Ra && Ua(lt)),
                          u !== s ? (e = n = [n, o, u]) : ((_a = e), (e = s)))
                        : ((_a = e), (e = s)),
                      e === s &&
                        (e = yl()) === s &&
                        (e = Ll()) === s &&
                        (e = bl()) === s &&
                        ((e = _a),
                        'grant' === r.substr(_a, 5).toLowerCase()
                          ? ((n = r.substr(_a, 5)), (_a += 5))
                          : ((n = s), 0 === Ra && Ua(ft)),
                        n !== s && (o = Zf()) !== s
                          ? ('option' === r.substr(_a, 6).toLowerCase()
                              ? ((u = r.substr(_a, 6)), (_a += 6))
                              : ((u = s), 0 === Ra && Ua(bt)),
                            u !== s ? (e = n = [n, o, u]) : ((_a = e), (e = s)))
                          : ((_a = e), (e = s)),
                        e === s &&
                          (e = kf()) === s &&
                          (e = Cl()) === s &&
                          (e = $f()) === s &&
                          (e = vl()) === s &&
                          ((e = _a),
                          (n = fl()) !== s &&
                          (o = Zf()) !== s &&
                          (u = Sf()) !== s
                            ? (e = n = [n, o, u])
                            : ((_a = e), (e = s)),
                          e === s && (e = gl()) === s && (e = dl())))),
                    e !== s && (t, (e = pt(e))),
                    (t = e)
                  );
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u;
                    return (
                      (t = _a),
                      (e = _a),
                      (n = pl()) !== s && (o = Zf()) !== s
                        ? ('routine' === r.substr(_a, 7).toLowerCase()
                            ? ((u = r.substr(_a, 7)), (_a += 7))
                            : ((u = s), 0 === Ra && Ua(vt)),
                          u !== s ? (e = n = [n, o, u]) : ((_a = e), (e = s)))
                        : ((_a = e), (e = s)),
                      e === s &&
                        ('execute' === r.substr(_a, 7).toLowerCase()
                          ? ((e = r.substr(_a, 7)), (_a += 7))
                          : ((e = s), 0 === Ra && Ua(dt)),
                        e === s &&
                          ((e = _a),
                          'grant' === r.substr(_a, 5).toLowerCase()
                            ? ((n = r.substr(_a, 5)), (_a += 5))
                            : ((n = s), 0 === Ra && Ua(ft)),
                          n !== s && (o = Zf()) !== s
                            ? ('option' === r.substr(_a, 6).toLowerCase()
                                ? ((u = r.substr(_a, 6)), (_a += 6))
                                : ((u = s), 0 === Ra && Ua(bt)),
                              u !== s
                                ? (e = n = [n, o, u])
                                : ((_a = e), (e = s)))
                            : ((_a = e), (e = s)),
                          e === s &&
                            ((e = _a),
                            (n = yl()) !== s && (o = Zf()) !== s
                              ? ('routine' === r.substr(_a, 7).toLowerCase()
                                  ? ((u = r.substr(_a, 7)), (_a += 7))
                                  : ((u = s), 0 === Ra && Ua(vt)),
                                u !== s
                                  ? (e = n = [n, o, u])
                                  : ((_a = e), (e = s)))
                              : ((_a = e), (e = s))))),
                      e !== s && (t, (e = pt(e))),
                      (t = e)
                    );
                  })()),
                t
              );
            }
            function bi() {
              var r, t, e, n, o, u, a, i, c;
              return (
                (r = _a),
                (t = fi()) !== s && Zf() !== s
                  ? ((e = _a),
                    (n = Wf()) !== s &&
                    (o = Zf()) !== s &&
                    (u = Hi()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Vf()) !== s
                      ? (e = n = [n, o, u, a, i])
                      : ((_a = e), (e = s)),
                    e === s && (e = null),
                    e !== s
                      ? (r, (r = t = { priv: t, columns: (c = e) && c[2] }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function pi() {
              var t, e, n, o, u, a, i;
              return (
                (t = _a),
                (e = _c()) !== s && Zf() !== s
                  ? ((n = _a),
                    64 === r.charCodeAt(_a)
                      ? ((o = '@'), _a++)
                      : ((o = s), 0 === Ra && Ua(N)),
                    o !== s && (u = Zf()) !== s && (a = _c()) !== s
                      ? (n = o = [o, u, a])
                      : ((_a = n), (n = s)),
                    n === s && (n = null),
                    n !== s
                      ? (t,
                        (t = e =
                          {
                            name: { type: 'single_quote_string', value: e },
                            host: (i = n)
                              ? { type: 'single_quote_string', value: i[2] }
                              : null,
                          }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function vi() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = pi()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = pi()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = pi()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = yt(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function di() {
              var t, e, n;
              return (
                (t = _a),
                Pl() !== s && Zf() !== s
                  ? ('admin' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua(wt)),
                    e !== s && Zf() !== s
                      ? ('option' === r.substr(_a, 6).toLowerCase()
                          ? ((n = r.substr(_a, 6)), (_a += 6))
                          : ((n = s), 0 === Ra && Ua(bt)),
                        n !== s
                          ? (t,
                            (t = {
                              type: 'origin',
                              value: 'with admin option',
                            }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function yi() {
              var t, e, n, o, u, a, i;
              return (
                (t = Ai()) === s &&
                  ((t = _a),
                  (e = _a),
                  40 === r.charCodeAt(_a)
                    ? ((n = '('), _a++)
                    : ((n = s), 0 === Ra && Ua(ht)),
                  n !== s &&
                  (o = Zf()) !== s &&
                  (u = yi()) !== s &&
                  (a = Zf()) !== s
                    ? (41 === r.charCodeAt(_a)
                        ? ((i = ')'), _a++)
                        : ((i = s), 0 === Ra && Ua(mt)),
                      i !== s ? (e = n = [n, o, u, a, i]) : ((_a = e), (e = s)))
                    : ((_a = e), (e = s)),
                  e !== s && (t, (e = { ...e[2], parentheses_symbol: !0 })),
                  (t = e)),
                t
              );
            }
            function wi() {
              var t, e, n, o, u, a, i, c, l;
              if (((t = _a), Pl() !== s))
                if (Zf() !== s)
                  if ((e = Li()) !== s) {
                    for (
                      n = [],
                        o = _a,
                        (u = Zf()) !== s &&
                        (a = Yf()) !== s &&
                        (i = Zf()) !== s &&
                        (c = Li()) !== s
                          ? (o = u = [u, a, i, c])
                          : ((_a = o), (o = s));
                      o !== s;

                    )
                      (n.push(o),
                        (o = _a),
                        (u = Zf()) !== s &&
                        (a = Yf()) !== s &&
                        (i = Zf()) !== s &&
                        (c = Li()) !== s
                          ? (o = u = [u, a, i, c])
                          : ((_a = o), (o = s)));
                    n !== s ? (t, (t = A(e, n))) : ((_a = t), (t = s));
                  } else ((_a = t), (t = s));
                else ((_a = t), (t = s));
              else ((_a = t), (t = s));
              return (
                t === s &&
                  ((t = _a),
                  Zf() !== s &&
                  Pl() !== s &&
                  (e = Zf()) !== s &&
                  (n = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      'RECURSIVE' === r.substr(_a, 9)
                        ? ((e = 'RECURSIVE'), (_a += 9))
                        : ((e = s), 0 === Ra && Ua(ko)));
                    e !== s
                      ? ((n = _a),
                        Ra++,
                        (o = jc()),
                        Ra--,
                        o === s ? (n = void 0) : ((_a = n), (n = s)),
                        n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    return t;
                  })()) !== s &&
                  (o = Zf()) !== s &&
                  (u = Li()) !== s
                    ? (t, ((l = u).recursive = !0), (t = [l]))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function Li() {
              var r, t, e, n, o, u, a;
              return (
                (r = _a),
                (t = zc()) === s && (t = xc()) === s && (t = Gi()),
                t !== s && Zf() !== s
                  ? ((e = Ci()) === s && (e = null),
                    e !== s &&
                    Zf() !== s &&
                    Sl() !== s &&
                    Zf() !== s &&
                    Wf() !== s &&
                    Zf() !== s &&
                    (n = Ha()) !== s &&
                    Zf() !== s &&
                    Vf() !== s
                      ? (r,
                        (u = e),
                        (a = n),
                        'string' == typeof (o = t) &&
                          (o = { type: 'default', value: o }),
                        o.table && (o = { type: 'default', value: o.table }),
                        (r = t = { name: o, stmt: a, columns: u }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Ci() {
              var r, t;
              return (
                (r = _a),
                Wf() !== s &&
                Zf() !== s &&
                (t = (function () {
                  var r;
                  (r = Hi()) === s &&
                    (r = (function () {
                      var r, t, e, n, o, u, a, i;
                      if (((r = _a), (t = Qc()) !== s)) {
                        for (
                          e = [],
                            n = _a,
                            (o = Zf()) !== s &&
                            (u = Yf()) !== s &&
                            (a = Zf()) !== s &&
                            (i = Qc()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s));
                          n !== s;

                        )
                          (e.push(n),
                            (n = _a),
                            (o = Zf()) !== s &&
                            (u = Yf()) !== s &&
                            (a = Zf()) !== s &&
                            (i = Qc()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s)));
                        e !== s
                          ? (r, (t = A(t, e)), (r = t))
                          : ((_a = r), (r = s));
                      } else ((_a = r), (r = s));
                      return r;
                    })());
                  return r;
                })()) !== s &&
                Zf() !== s &&
                Vf() !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function hi() {
              var t, e, n, o, u, a, i;
              if (((t = _a), (e = gc()) !== s))
                if (Zf() !== s)
                  if ((n = Wf()) !== s)
                    if (Zf() !== s) {
                      if (
                        ((o = []),
                        Et.test(r.charAt(_a))
                          ? ((u = r.charAt(_a)), _a++)
                          : ((u = s), 0 === Ra && Ua(At)),
                        u !== s)
                      )
                        for (; u !== s; )
                          (o.push(u),
                            Et.test(r.charAt(_a))
                              ? ((u = r.charAt(_a)), _a++)
                              : ((u = s), 0 === Ra && Ua(At)));
                      else o = s;
                      o !== s && (u = Zf()) !== s && Vf() !== s && Zf() !== s
                        ? ((a = $l()) === s && (a = Hl()),
                          a === s && (a = null),
                          a !== s
                            ? (t,
                              (i = a),
                              (t = e =
                                {
                                  type: 'column_ref',
                                  column: e,
                                  suffix: `(${parseInt(o.join(''), 10)})`,
                                  order_by: i,
                                }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                  else ((_a = t), (t = s));
                else ((_a = t), (t = s));
              else ((_a = t), (t = s));
              return (
                t === s &&
                  ((t = _a),
                  (e = gc()) !== s && Zf() !== s
                    ? ((n = $l()) === s && (n = Hl()),
                      n === s && (n = null),
                      n !== s
                        ? (t,
                          (t = e =
                            (function (r, t) {
                              return {
                                type: 'column_ref',
                                column: r,
                                order_by: t,
                              };
                            })(e, n)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function mi() {
              var r, t;
              return (
                (r = _a),
                Wf() !== s &&
                Zf() !== s &&
                (t = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = hi()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = hi()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = hi()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)));
                    e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s &&
                Zf() !== s &&
                Vf() !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Ei() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n, o, u, a;
                  return (
                    (t = _a),
                    (e = _a),
                    'for' === r.substr(_a, 3).toLowerCase()
                      ? ((n = r.substr(_a, 3)), (_a += 3))
                      : ((n = s), 0 === Ra && Ua(O)),
                    n !== s && (o = Zf()) !== s && (u = dl()) !== s
                      ? (e = n = [n, o, u])
                      : ((_a = e), (e = s)),
                    e !== s && (t, (e = `${(a = e)[0]} ${a[2][0]}`)),
                    (t = e)
                  );
                })()) === s &&
                  (e = (function () {
                    var t, e, n, o, u, a, i, c, l, f;
                    return (
                      (t = _a),
                      (e = _a),
                      'lock' === r.substr(_a, 4).toLowerCase()
                        ? ((n = r.substr(_a, 4)), (_a += 4))
                        : ((n = s), 0 === Ra && Ua(rr)),
                      n !== s && (o = Zf()) !== s
                        ? ('in' === r.substr(_a, 2).toLowerCase()
                            ? ((u = r.substr(_a, 2)), (_a += 2))
                            : ((u = s), 0 === Ra && Ua(Tt)),
                          u !== s && (a = Zf()) !== s
                            ? ('share' === r.substr(_a, 5).toLowerCase()
                                ? ((i = r.substr(_a, 5)), (_a += 5))
                                : ((i = s), 0 === Ra && Ua(It)),
                              i !== s && (c = Zf()) !== s
                                ? ('mode' === r.substr(_a, 4).toLowerCase()
                                    ? ((l = r.substr(_a, 4)), (_a += 4))
                                    : ((l = s), 0 === Ra && Ua(_t)),
                                  l !== s
                                    ? (e = n = [n, o, u, a, i, c, l])
                                    : ((_a = e), (e = s)))
                                : ((_a = e), (e = s)))
                            : ((_a = e), (e = s)))
                        : ((_a = e), (e = s)),
                      e !== s &&
                        (t, (e = `${(f = e)[0]} ${f[2]} ${f[4]} ${f[6]}`)),
                      (t = e)
                    );
                  })()),
                e !== s && Zf() !== s
                  ? ((n = (function () {
                      var t, e, n, o, u, a, i;
                      return (
                        (t = _a),
                        (e = _a),
                        'wait' === r.substr(_a, 4).toLowerCase()
                          ? ((n = r.substr(_a, 4)), (_a += 4))
                          : ((n = s), 0 === Ra && Ua(St)),
                        n !== s && (o = Zf()) !== s && (u = el()) !== s
                          ? (e = n = [n, o, u])
                          : ((_a = e), (e = s)),
                        e !== s && (t, (e = `${(a = e)[0]} ${a[2].value}`)),
                        (t = e) === s &&
                          ('nowait' === r.substr(_a, 6).toLowerCase()
                            ? ((t = r.substr(_a, 6)), (_a += 6))
                            : ((t = s), 0 === Ra && Ua(Nt)),
                          t === s &&
                            ((t = _a),
                            (e = _a),
                            'skip' === r.substr(_a, 4).toLowerCase()
                              ? ((n = r.substr(_a, 4)), (_a += 4))
                              : ((n = s), 0 === Ra && Ua(gt)),
                            n !== s && (o = Zf()) !== s
                              ? ('locked' === r.substr(_a, 6).toLowerCase()
                                  ? ((u = r.substr(_a, 6)), (_a += 6))
                                  : ((u = s), 0 === Ra && Ua(Rt)),
                                u !== s
                                  ? (e = n = [n, o, u])
                                  : ((_a = e), (e = s)))
                              : ((_a = e), (e = s)),
                            e !== s && (t, (e = `${(i = e)[0]} ${i[2]}`)),
                            (t = e))),
                        t
                      );
                    })()) === s && (n = null),
                    n !== s
                      ? (t, (t = e = e + ((o = n) ? ' ' + o : '')))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ai() {
              var t, e, n, o, u, a, i, c, l, f, b, p, v, d, y, w;
              return (
                (t = _a),
                Zf() !== s
                  ? ((e = wi()) === s && (e = null),
                    e !== s && Zf() !== s && vl() !== s && zf() !== s
                      ? ((n = (function () {
                          var r, t, e, n, o, u;
                          if (((r = _a), (t = Ti()) !== s)) {
                            for (
                              e = [],
                                n = _a,
                                (o = Zf()) !== s && (u = Ti()) !== s
                                  ? (n = o = [o, u])
                                  : ((_a = n), (n = s));
                              n !== s;

                            )
                              (e.push(n),
                                (n = _a),
                                (o = Zf()) !== s && (u = Ti()) !== s
                                  ? (n = o = [o, u])
                                  : ((_a = n), (n = s)));
                            e !== s
                              ? (r,
                                (t = (function (r, t) {
                                  const e = [r];
                                  for (let r = 0, n = t.length; r < n; ++r)
                                    e.push(t[r][1]);
                                  return e;
                                })(t, e)),
                                (r = t))
                              : ((_a = r), (r = s));
                          } else ((_a = r), (r = s));
                          return r;
                        })()) === s && (n = null),
                        n !== s && Zf() !== s
                          ? ((o = Bl()) === s && (o = null),
                            o !== s &&
                            Zf() !== s &&
                            (u = Ii()) !== s &&
                            Zf() !== s
                              ? ((a = gi()) === s && (a = null),
                                a !== s && Zf() !== s
                                  ? ((i = Ri()) === s && (i = null),
                                    i !== s && Zf() !== s
                                      ? ((c = gi()) === s && (c = null),
                                        c !== s && Zf() !== s
                                          ? ((l = $i()) === s && (l = null),
                                            l !== s && Zf() !== s
                                              ? ((f = (function () {
                                                  var t, e, n;
                                                  ((t = _a),
                                                    (e = (function () {
                                                      var t, e, n, o;
                                                      ((t = _a),
                                                        'group' ===
                                                        r
                                                          .substr(_a, 5)
                                                          .toLowerCase()
                                                          ? ((e = r.substr(
                                                              _a,
                                                              5
                                                            )),
                                                            (_a += 5))
                                                          : ((e = s),
                                                            0 === Ra &&
                                                              Ua(is)));
                                                      e !== s
                                                        ? ((n = _a),
                                                          Ra++,
                                                          (o = jc()),
                                                          Ra--,
                                                          o === s
                                                            ? (n = void 0)
                                                            : ((_a = n),
                                                              (n = s)),
                                                          n !== s
                                                            ? (t = e = [e, n])
                                                            : ((_a = t),
                                                              (t = s)))
                                                        : ((_a = t), (t = s));
                                                      return t;
                                                    })()) !== s &&
                                                    Zf() !== s &&
                                                    Fl() !== s &&
                                                    Zf() !== s &&
                                                    (n = ec()) !== s
                                                      ? (t,
                                                        (e = n.value),
                                                        (t = e))
                                                      : ((_a = t), (t = s)));
                                                  return t;
                                                })()) === s && (f = null),
                                                f !== s && Zf() !== s
                                                  ? ((b = (function () {
                                                      var t, e;
                                                      ((t = _a),
                                                        (function () {
                                                          var t, e, n, o;
                                                          ((t = _a),
                                                            'having' ===
                                                            r
                                                              .substr(_a, 6)
                                                              .toLowerCase()
                                                              ? ((e = r.substr(
                                                                  _a,
                                                                  6
                                                                )),
                                                                (_a += 6))
                                                              : ((e = s),
                                                                0 === Ra &&
                                                                  Ua(fs)));
                                                          e !== s
                                                            ? ((n = _a),
                                                              Ra++,
                                                              (o = jc()),
                                                              Ra--,
                                                              o === s
                                                                ? (n = void 0)
                                                                : ((_a = n),
                                                                  (n = s)),
                                                              n !== s
                                                                ? (t = e =
                                                                    [e, n])
                                                                : ((_a = t),
                                                                  (t = s)))
                                                            : ((_a = t),
                                                              (t = s));
                                                          return t;
                                                        })() !== s &&
                                                        Zf() !== s &&
                                                        (e = cc()) !== s
                                                          ? (t, (t = e))
                                                          : ((_a = t),
                                                            (t = s)));
                                                      return t;
                                                    })()) === s && (b = null),
                                                    b !== s && Zf() !== s
                                                      ? ((p = Bi()) === s &&
                                                          (p = null),
                                                        p !== s && Zf() !== s
                                                          ? ((v = qi()) === s &&
                                                              (v = null),
                                                            v !== s &&
                                                            Zf() !== s
                                                              ? ((d = Ei()) ===
                                                                  s &&
                                                                  (d = null),
                                                                d !== s &&
                                                                Zf() !== s
                                                                  ? ((y =
                                                                      (function () {
                                                                        var t,
                                                                          e,
                                                                          n;
                                                                        ((t =
                                                                          _a),
                                                                          'window' ===
                                                                          r
                                                                            .substr(
                                                                              _a,
                                                                              6
                                                                            )
                                                                            .toLowerCase()
                                                                            ? ((e =
                                                                                r.substr(
                                                                                  _a,
                                                                                  6
                                                                                )),
                                                                              (_a += 6))
                                                                            : ((e =
                                                                                s),
                                                                              0 ===
                                                                                Ra &&
                                                                                Ua(
                                                                                  $e
                                                                                )));
                                                                        e !==
                                                                          s &&
                                                                        Zf() !==
                                                                          s &&
                                                                        (n =
                                                                          (function () {
                                                                            var r,
                                                                              t,
                                                                              e,
                                                                              n,
                                                                              o,
                                                                              u,
                                                                              a,
                                                                              i;
                                                                            if (
                                                                              ((r =
                                                                                _a),
                                                                              (t =
                                                                                Gc()) !==
                                                                                s)
                                                                            ) {
                                                                              for (
                                                                                e =
                                                                                  [],
                                                                                  n =
                                                                                    _a,
                                                                                  (o =
                                                                                    Zf()) !==
                                                                                    s &&
                                                                                  (u =
                                                                                    Yf()) !==
                                                                                    s &&
                                                                                  (a =
                                                                                    Zf()) !==
                                                                                    s &&
                                                                                  (i =
                                                                                    Gc()) !==
                                                                                    s
                                                                                    ? (n =
                                                                                        o =
                                                                                          [
                                                                                            o,
                                                                                            u,
                                                                                            a,
                                                                                            i,
                                                                                          ])
                                                                                    : ((_a =
                                                                                        n),
                                                                                      (n =
                                                                                        s));
                                                                                n !==
                                                                                s;

                                                                              )
                                                                                (e.push(
                                                                                  n
                                                                                ),
                                                                                  (n =
                                                                                    _a),
                                                                                  (o =
                                                                                    Zf()) !==
                                                                                    s &&
                                                                                  (u =
                                                                                    Yf()) !==
                                                                                    s &&
                                                                                  (a =
                                                                                    Zf()) !==
                                                                                    s &&
                                                                                  (i =
                                                                                    Gc()) !==
                                                                                    s
                                                                                    ? (n =
                                                                                        o =
                                                                                          [
                                                                                            o,
                                                                                            u,
                                                                                            a,
                                                                                            i,
                                                                                          ])
                                                                                    : ((_a =
                                                                                        n),
                                                                                      (n =
                                                                                        s)));
                                                                              e !==
                                                                              s
                                                                                ? (r,
                                                                                  (t =
                                                                                    Tb(
                                                                                      t,
                                                                                      e
                                                                                    )),
                                                                                  (r =
                                                                                    t))
                                                                                : ((_a =
                                                                                    r),
                                                                                  (r =
                                                                                    s));
                                                                            } else
                                                                              ((_a =
                                                                                r),
                                                                                (r =
                                                                                  s));
                                                                            return r;
                                                                          })()) !==
                                                                          s
                                                                          ? (t,
                                                                            (t =
                                                                              e =
                                                                                {
                                                                                  keyword:
                                                                                    'window',
                                                                                  type: 'window',
                                                                                  expr: n,
                                                                                }))
                                                                          : ((_a =
                                                                              t),
                                                                            (t =
                                                                              s));
                                                                        return t;
                                                                      })()) ===
                                                                      s &&
                                                                      (y =
                                                                        null),
                                                                    y !== s &&
                                                                    Zf() !== s
                                                                      ? ((w =
                                                                          gi()) ===
                                                                          s &&
                                                                          (w =
                                                                            null),
                                                                        w !== s
                                                                          ? (t,
                                                                            (t =
                                                                              (function (
                                                                                r,
                                                                                t,
                                                                                e,
                                                                                n,
                                                                                o,
                                                                                s,
                                                                                u,
                                                                                a,
                                                                                i,
                                                                                c,
                                                                                l,
                                                                                f,
                                                                                b,
                                                                                p,
                                                                                v
                                                                              ) {
                                                                                if (
                                                                                  (o &&
                                                                                    u) ||
                                                                                  (o &&
                                                                                    v) ||
                                                                                  (u &&
                                                                                    v) ||
                                                                                  (o &&
                                                                                    u &&
                                                                                    v)
                                                                                )
                                                                                  throw new Error(
                                                                                    'A given SQL statement can contain at most one INTO clause'
                                                                                  );
                                                                                return (
                                                                                  s &&
                                                                                    s.forEach(
                                                                                      (
                                                                                        r
                                                                                      ) =>
                                                                                        r.table &&
                                                                                        gb.add(
                                                                                          `select::${r.db}::${r.table}`
                                                                                        )
                                                                                    ),
                                                                                  {
                                                                                    with: r,
                                                                                    type: 'select',
                                                                                    options:
                                                                                      t,
                                                                                    distinct:
                                                                                      e,
                                                                                    columns:
                                                                                      n,
                                                                                    into: {
                                                                                      ...(o ||
                                                                                        u ||
                                                                                        v ||
                                                                                        {}),
                                                                                      position:
                                                                                        (o
                                                                                          ? 'column'
                                                                                          : u &&
                                                                                            'from') ||
                                                                                        (v &&
                                                                                          'end'),
                                                                                    },
                                                                                    from: s,
                                                                                    where:
                                                                                      a,
                                                                                    groupby:
                                                                                      i,
                                                                                    having:
                                                                                      c,
                                                                                    orderby:
                                                                                      l,
                                                                                    limit:
                                                                                      f,
                                                                                    locking_read:
                                                                                      b &&
                                                                                      b,
                                                                                    window:
                                                                                      p,
                                                                                  }
                                                                                );
                                                                              })(
                                                                                e,
                                                                                n,
                                                                                o,
                                                                                u,
                                                                                a,
                                                                                i,
                                                                                c,
                                                                                l,
                                                                                f,
                                                                                b,
                                                                                p,
                                                                                v,
                                                                                d,
                                                                                y,
                                                                                w
                                                                              )))
                                                                          : ((_a =
                                                                              t),
                                                                            (t =
                                                                              s)))
                                                                      : ((_a =
                                                                          t),
                                                                        (t =
                                                                          s)))
                                                                  : ((_a = t),
                                                                    (t = s)))
                                                              : ((_a = t),
                                                                (t = s)))
                                                          : ((_a = t), (t = s)))
                                                      : ((_a = t), (t = s)))
                                                  : ((_a = t), (t = s)))
                                              : ((_a = t), (t = s)))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ti() {
              var t, e;
              return (
                (t = _a),
                (e = (function () {
                  var t;
                  'sql_calc_found_rows' === r.substr(_a, 19).toLowerCase()
                    ? ((t = r.substr(_a, 19)), (_a += 19))
                    : ((t = s), 0 === Ra && Ua(Ku));
                  return t;
                })()) === s &&
                  ((e = (function () {
                    var t;
                    'sql_cache' === r.substr(_a, 9).toLowerCase()
                      ? ((t = r.substr(_a, 9)), (_a += 9))
                      : ((t = s), 0 === Ra && Ua(Qu));
                    return t;
                  })()) === s &&
                    (e = (function () {
                      var t;
                      'sql_no_cache' === r.substr(_a, 12).toLowerCase()
                        ? ((t = r.substr(_a, 12)), (_a += 12))
                        : ((t = s), 0 === Ra && Ua(Zu));
                      return t;
                    })()),
                  e === s &&
                    (e = (function () {
                      var t;
                      'sql_big_result' === r.substr(_a, 14).toLowerCase()
                        ? ((t = r.substr(_a, 14)), (_a += 14))
                        : ((t = s), 0 === Ra && Ua(Ju));
                      return t;
                    })()) === s &&
                    (e = (function () {
                      var t;
                      'sql_small_result' === r.substr(_a, 16).toLowerCase()
                        ? ((t = r.substr(_a, 16)), (_a += 16))
                        : ((t = s), 0 === Ra && Ua(zu));
                      return t;
                    })()) === s &&
                    (e = (function () {
                      var t;
                      'sql_buffer_result' === r.substr(_a, 17).toLowerCase()
                        ? ((t = r.substr(_a, 17)), (_a += 17))
                        : ((t = s), 0 === Ra && Ua(ra));
                      return t;
                    })())),
                e !== s && (t, (e = e)),
                (t = e)
              );
            }
            function Ii() {
              var r, t, e, n, o, u, a, i;
              if (
                ((r = _a),
                (t = Yl()) === s &&
                  ((t = _a),
                  (e = Bf()) !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s && (t = Bf())),
                t !== s)
              ) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Si()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Si()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s
                  ? (r,
                    (r = t =
                      (function (r, t) {
                        Rb.add('select::null::(.*)');
                        const e = {
                          expr: {
                            type: 'column_ref',
                            table: null,
                            column: '*',
                          },
                          as: null,
                        };
                        return t && t.length > 0 ? Tb(e, t) : [e];
                      })(0, e)))
                  : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              if (r === s)
                if (((r = _a), (t = Si()) !== s)) {
                  for (
                    e = [],
                      n = _a,
                      (o = Zf()) !== s &&
                      (u = Yf()) !== s &&
                      (a = Zf()) !== s &&
                      (i = Si()) !== s
                        ? (n = o = [o, u, a, i])
                        : ((_a = n), (n = s));
                    n !== s;

                  )
                    (e.push(n),
                      (n = _a),
                      (o = Zf()) !== s &&
                      (u = Yf()) !== s &&
                      (a = Zf()) !== s &&
                      (i = Si()) !== s
                        ? (n = o = [o, u, a, i])
                        : ((_a = n), (n = s)));
                  e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
                } else ((_a = r), (r = s));
              return r;
            }
            function _i() {
              var t, e, n, o, u, a, i;
              return (
                (t = _a),
                'match' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(Dt)),
                e !== s &&
                Zf() !== s &&
                Wf() !== s &&
                Zf() !== s &&
                (n = Hi()) !== s &&
                Zf() !== s &&
                Vf() !== s &&
                Zf() !== s
                  ? ('AGAINST' === r.substr(_a, 7)
                      ? ((o = 'AGAINST'), (_a += 7))
                      : ((o = s), 0 === Ra && Ua(Pt)),
                    o !== s &&
                    Zf() !== s &&
                    Wf() !== s &&
                    Zf() !== s &&
                    (u = ic()) !== s &&
                    Zf() !== s
                      ? ((a = (function () {
                          var t, e, n, o, u, a, i;
                          return (
                            (t = _a),
                            Vl() !== s && Zf() !== s
                              ? ('natural' === r.substr(_a, 7).toLowerCase()
                                  ? ((e = r.substr(_a, 7)), (_a += 7))
                                  : ((e = s), 0 === Ra && Ua(Ot)),
                                e !== s && Zf() !== s
                                  ? ('language' ===
                                    r.substr(_a, 8).toLowerCase()
                                      ? ((n = r.substr(_a, 8)), (_a += 8))
                                      : ((n = s), 0 === Ra && Ua(xt)),
                                    n !== s && Zf() !== s
                                      ? ('mode' ===
                                        r.substr(_a, 4).toLowerCase()
                                          ? ((o = r.substr(_a, 4)), (_a += 4))
                                          : ((o = s), 0 === Ra && Ua(_t)),
                                        o !== s && Zf() !== s
                                          ? ('with' ===
                                            r.substr(_a, 4).toLowerCase()
                                              ? ((u = r.substr(_a, 4)),
                                                (_a += 4))
                                              : ((u = s), 0 === Ra && Ua(jt)),
                                            u !== s && Zf() !== s
                                              ? ('query' ===
                                                r.substr(_a, 5).toLowerCase()
                                                  ? ((a = r.substr(_a, 5)),
                                                    (_a += 5))
                                                  : ((a = s),
                                                    0 === Ra && Ua(kt)),
                                                a !== s && Zf() !== s
                                                  ? ('expansion' ===
                                                    r
                                                      .substr(_a, 9)
                                                      .toLowerCase()
                                                      ? ((i = r.substr(_a, 9)),
                                                        (_a += 9))
                                                      : ((i = s),
                                                        0 === Ra && Ua(Ut)),
                                                    i !== s
                                                      ? (t,
                                                        (t = {
                                                          type: 'origin',
                                                          value:
                                                            'IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION',
                                                        }))
                                                      : ((_a = t), (t = s)))
                                                  : ((_a = t), (t = s)))
                                              : ((_a = t), (t = s)))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t === s &&
                              ((t = _a),
                              Vl() !== s && Zf() !== s
                                ? ('natural' === r.substr(_a, 7).toLowerCase()
                                    ? ((e = r.substr(_a, 7)), (_a += 7))
                                    : ((e = s), 0 === Ra && Ua(Ot)),
                                  e !== s && Zf() !== s
                                    ? ('language' ===
                                      r.substr(_a, 8).toLowerCase()
                                        ? ((n = r.substr(_a, 8)), (_a += 8))
                                        : ((n = s), 0 === Ra && Ua(xt)),
                                      n !== s && Zf() !== s
                                        ? ('mode' ===
                                          r.substr(_a, 4).toLowerCase()
                                            ? ((o = r.substr(_a, 4)), (_a += 4))
                                            : ((o = s), 0 === Ra && Ua(_t)),
                                          o !== s
                                            ? (t,
                                              (t = {
                                                type: 'origin',
                                                value:
                                                  'IN NATURAL LANGUAGE MODE',
                                              }))
                                            : ((_a = t), (t = s)))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)),
                              t === s &&
                                ((t = _a),
                                Vl() !== s && Zf() !== s
                                  ? ('boolean' === r.substr(_a, 7).toLowerCase()
                                      ? ((e = r.substr(_a, 7)), (_a += 7))
                                      : ((e = s), 0 === Ra && Ua(Mt)),
                                    e !== s && Zf() !== s
                                      ? ('mode' ===
                                        r.substr(_a, 4).toLowerCase()
                                          ? ((n = r.substr(_a, 4)), (_a += 4))
                                          : ((n = s), 0 === Ra && Ua(_t)),
                                        n !== s
                                          ? (t,
                                            (t = {
                                              type: 'origin',
                                              value: 'IN BOOLEAN MODE',
                                            }))
                                          : ((_a = t), (t = s)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)),
                                t === s &&
                                  ((t = _a),
                                  Pl() !== s && Zf() !== s
                                    ? ('query' === r.substr(_a, 5).toLowerCase()
                                        ? ((e = r.substr(_a, 5)), (_a += 5))
                                        : ((e = s), 0 === Ra && Ua(kt)),
                                      e !== s && Zf() !== s
                                        ? ('expansion' ===
                                          r.substr(_a, 9).toLowerCase()
                                            ? ((n = r.substr(_a, 9)), (_a += 9))
                                            : ((n = s), 0 === Ra && Ua(Ut)),
                                          n !== s
                                            ? (t,
                                              (t = {
                                                type: 'origin',
                                                value: 'WITH QUERY EXPANSION',
                                              }))
                                            : ((_a = t), (t = s)))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s))))),
                            t
                          );
                        })()) === s && (a = null),
                        a !== s && Zf() !== s && Vf() !== s && Zf() !== s
                          ? ((i = Ni()) === s && (i = null),
                            i !== s
                              ? (t,
                                (t = e =
                                  {
                                    against: 'against',
                                    columns: n,
                                    expr: u,
                                    match: 'match',
                                    mode: a,
                                    type: 'fulltext_search',
                                    as: i,
                                  }))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Si() {
              var r, t, e, n, o, u, a, i;
              return (
                (r = _a),
                (t = _i()) !== s &&
                  (r,
                  (t = (function (r) {
                    const { as: t, ...e } = r;
                    return { expr: e, as: t };
                  })(t))),
                (r = t) === s &&
                  ((r = _a),
                  (t = _c()) !== s &&
                  (e = Zf()) !== s &&
                  (n = Hf()) !== s &&
                  (o = Zf()) !== s &&
                  (u = _c()) !== s &&
                  Zf() !== s &&
                  Hf() !== s &&
                  Zf() !== s &&
                  Bf() !== s
                    ? (r,
                      (a = t),
                      (i = u),
                      Rb.add(`select::${a}::${i}::(.*)`),
                      (r = t =
                        {
                          expr: {
                            type: 'column_ref',
                            db: a,
                            table: i,
                            column: '*',
                          },
                          as: null,
                        }))
                    : ((_a = r), (r = s)),
                  r === s &&
                    ((r = _a),
                    (t = _a),
                    (e = _c()) !== s && (n = Zf()) !== s && (o = Hf()) !== s
                      ? (t = e = [e, n, o])
                      : ((_a = t), (t = s)),
                    t === s && (t = null),
                    t !== s && (e = Zf()) !== s && (n = Bf()) !== s
                      ? (r,
                        (r = t =
                          (function (r) {
                            return (
                              Rb.add(`select::${r}::(.*)`),
                              {
                                expr: {
                                  type: 'column_ref',
                                  table: (r && r[0]) || null,
                                  column: '*',
                                },
                                as: null,
                              }
                            );
                          })(t)))
                      : ((_a = r), (r = s)),
                    r === s &&
                      ((r = _a),
                      (t = (function () {
                        var r, t, e, n;
                        ((r = _a), (t = vb()) === s && (t = db()));
                        t !== s &&
                        Zf() !== s &&
                        (e = Rf()) !== s &&
                        Zf() !== s &&
                        (n = ub()) !== s
                          ? (r, (t = ya(t, e, n)), (r = t))
                          : ((_a = r), (r = s));
                        return r;
                      })()) !== s && (r, (t = { expr: t, as: null })),
                      (r = t) === s &&
                        ((r = _a),
                        (t = (function () {
                          var r, t, e, n, o, u, a, i;
                          if (((r = _a), (t = ic()) !== s)) {
                            for (
                              e = [],
                                n = _a,
                                (o = Zf()) !== s
                                  ? ((u = Zl()) === s &&
                                      (u = zl()) === s &&
                                      (u = Qf()),
                                    u !== s &&
                                    (a = Zf()) !== s &&
                                    (i = ic()) !== s
                                      ? (n = o = [o, u, a, i])
                                      : ((_a = n), (n = s)))
                                  : ((_a = n), (n = s));
                              n !== s;

                            )
                              (e.push(n),
                                (n = _a),
                                (o = Zf()) !== s
                                  ? ((u = Zl()) === s &&
                                      (u = zl()) === s &&
                                      (u = Qf()),
                                    u !== s &&
                                    (a = Zf()) !== s &&
                                    (i = ic()) !== s
                                      ? (n = o = [o, u, a, i])
                                      : ((_a = n), (n = s)))
                                  : ((_a = n), (n = s)));
                            e !== s
                              ? (r,
                                (t = (function (r, t) {
                                  const e = r.ast;
                                  if (
                                    e &&
                                    'select' === e.type &&
                                    (!(
                                      r.parentheses_symbol ||
                                      r.parentheses ||
                                      r.ast.parentheses ||
                                      r.ast.parentheses_symbol
                                    ) ||
                                      1 !== e.columns.length ||
                                      '*' === e.columns[0].expr.column)
                                  )
                                    throw new Error(
                                      'invalid column clause with select statement'
                                    );
                                  if (!t || 0 === t.length) return r;
                                  const n = t.length;
                                  let o = t[n - 1][3];
                                  for (let e = n - 1; e >= 0; e--) {
                                    const n = 0 === e ? r : t[e - 1][3];
                                    o = Eb(t[e][1], n, o);
                                  }
                                  return o;
                                })(t, e)),
                                (r = t))
                              : ((_a = r), (r = s));
                          } else ((_a = r), (r = s));
                          return r;
                        })()) !== s && (e = Zf()) !== s
                          ? ((n = Ni()) === s && (n = null),
                            n !== s
                              ? (r, (r = t = { expr: t, as: n }))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s)))))),
                r
              );
            }
            function Ni() {
              var r, t, e;
              return (
                (r = _a),
                (t = Sl()) !== s &&
                Zf() !== s &&
                (e = (function () {
                  var r, t;
                  ((r = _a),
                    (t = xc()) !== s
                      ? (_a,
                        ((function (r) {
                          if (!0 === hb[r.toUpperCase()])
                            throw new Error(
                              'Error: ' +
                                JSON.stringify(r) +
                                ' is a reserved word, can not as alias clause'
                            );
                          return !1;
                        })(t)
                          ? s
                          : void 0) !== s
                          ? (r, (r = t = t))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s)));
                  r === s &&
                    ((r = _a), (t = Sc()) !== s && (r, (t = t)), (r = t));
                  return r;
                })()) !== s
                  ? (r, (r = t = e))
                  : ((_a = r), (r = s)),
                r === s &&
                  ((r = _a),
                  (t = Sl()) === s && (t = null),
                  t !== s && Zf() !== s && (e = _c()) !== s
                    ? (r, (r = t = e))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function gi() {
              var t, e, n;
              return (
                (t = _a),
                Tl() !== s &&
                Zf() !== s &&
                (e = (function () {
                  var r, t, e, n, o, u, a, c;
                  if (((r = _a), (t = vb()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (c = vb()) !== s
                          ? (n = o = [o, u, a, c])
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (c = vb()) !== s
                          ? (n = o = [o, u, a, c])
                          : ((_a = n), (n = s)));
                    e !== s ? (r, (t = i(t, e)), (r = t)) : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s
                  ? (t, (t = { keyword: 'var', type: 'into', expr: e }))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  Tl() !== s && Zf() !== s
                    ? ('outfile' === r.substr(_a, 7).toLowerCase()
                        ? ((e = r.substr(_a, 7)), (_a += 7))
                        : ((e = s), 0 === Ra && Ua(Gt)),
                      e === s &&
                        ('dumpfile' === r.substr(_a, 8).toLowerCase()
                          ? ((e = r.substr(_a, 8)), (_a += 8))
                          : ((e = s), 0 === Ra && Ua(Ft))),
                      e === s && (e = null),
                      e !== s && Zf() !== s
                        ? ((n = zc()) === s && (n = _c()),
                          n !== s
                            ? (t, (t = { keyword: e, type: 'into', expr: n }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function Ri() {
              var r, t;
              return (
                (r = _a),
                Il() !== s && Zf() !== s && (t = Ui()) !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Oi() {
              var r, t, e;
              return (
                (r = _a),
                (t = Gi()) !== s &&
                Zf() !== s &&
                ll() !== s &&
                Zf() !== s &&
                (e = Gi()) !== s
                  ? (r, (r = t = [t, e]))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function xi() {
              var t, e;
              return (
                (t = _a),
                Dl() !== s && Zf() !== s
                  ? ('btree' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua($t)),
                    e === s &&
                      ('hash' === r.substr(_a, 4).toLowerCase()
                        ? ((e = r.substr(_a, 4)), (_a += 4))
                        : ((e = s), 0 === Ra && Ua(Ht))),
                    e !== s
                      ? (t, (t = { keyword: 'using', type: e.toLowerCase() }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ji() {
              var r, t, e, n, o, u;
              if (((r = _a), (t = ki()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s && (u = ki()) !== s
                      ? (n = o = [o, u])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s && (u = ki()) !== s
                      ? (n = o = [o, u])
                      : ((_a = n), (n = s)));
                e !== s
                  ? (r,
                    (r = t =
                      (function (r, t) {
                        const e = [r];
                        for (let r = 0; r < t.length; r++) e.push(t[r][1]);
                        return e;
                      })(t, e)))
                  : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function ki() {
              var t, e, n, o, u, a;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'key_block_size' === r.substr(_a, 14).toLowerCase()
                      ? ((e = r.substr(_a, 14)), (_a += 14))
                      : ((e = s), 0 === Ra && Ua(Ir)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s
                        ? (t, (t = e = 'KEY_BLOCK_SIZE'))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })()) !== s && Zf() !== s
                  ? ((n = Of()) === s && (n = null),
                    n !== s && Zf() !== s && (o = el()) !== s
                      ? (t,
                        (u = n),
                        (a = o),
                        (t = e = { type: e.toLowerCase(), symbol: u, expr: a }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  (t = xi()) === s &&
                  ((t = _a),
                  'with' === r.substr(_a, 4).toLowerCase()
                    ? ((e = r.substr(_a, 4)), (_a += 4))
                    : ((e = s), 0 === Ra && Ua(jt)),
                  e !== s && Zf() !== s
                    ? ('parser' === r.substr(_a, 6).toLowerCase()
                        ? ((n = r.substr(_a, 6)), (_a += 6))
                        : ((n = s), 0 === Ra && Ua(Yt)),
                      n !== s && Zf() !== s && (o = xc()) !== s
                        ? (t, (t = e = { type: 'with parser', expr: o }))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    'visible' === r.substr(_a, 7).toLowerCase()
                      ? ((e = r.substr(_a, 7)), (_a += 7))
                      : ((e = s), 0 === Ra && Ua(Bt)),
                    e === s &&
                      ('invisible' === r.substr(_a, 9).toLowerCase()
                        ? ((e = r.substr(_a, 9)), (_a += 9))
                        : ((e = s), 0 === Ra && Ua(Wt))),
                    e !== s &&
                      (t,
                      (e = (function (r) {
                        return { type: r.toLowerCase(), expr: r.toLowerCase() };
                      })(e))),
                    (t = e) === s && (t = rb()))),
                t
              );
            }
            function Ui() {
              var r, t, e, n;
              if (((r = _a), (t = Di()) !== s)) {
                for (e = [], n = Mi(); n !== s; ) (e.push(n), (n = Mi()));
                e !== s ? (r, (r = t = Vt(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function Mi() {
              var r, t, e;
              return (
                (r = _a),
                Zf() !== s && (t = Yf()) !== s && Zf() !== s && (e = Di()) !== s
                  ? (r, (r = e))
                  : ((_a = r), (r = s)),
                r === s &&
                  ((r = _a),
                  Zf() !== s &&
                  (t = (function () {
                    var r, t, e, n, o, u, a, i, c, l, f;
                    if (((r = _a), (t = Pi()) !== s))
                      if (Zf() !== s)
                        if ((e = Di()) !== s)
                          if (Zf() !== s)
                            if ((n = Dl()) !== s)
                              if (Zf() !== s)
                                if (Wf() !== s)
                                  if (Zf() !== s)
                                    if ((o = xc()) !== s) {
                                      for (
                                        u = [],
                                          a = _a,
                                          (i = Zf()) !== s &&
                                          (c = Yf()) !== s &&
                                          (l = Zf()) !== s &&
                                          (f = xc()) !== s
                                            ? (a = i = [i, c, l, f])
                                            : ((_a = a), (a = s));
                                        a !== s;

                                      )
                                        (u.push(a),
                                          (a = _a),
                                          (i = Zf()) !== s &&
                                          (c = Yf()) !== s &&
                                          (l = Zf()) !== s &&
                                          (f = xc()) !== s
                                            ? (a = i = [i, c, l, f])
                                            : ((_a = a), (a = s)));
                                      u !== s &&
                                      (a = Zf()) !== s &&
                                      (i = Vf()) !== s
                                        ? (r,
                                          (b = t),
                                          (v = o),
                                          (d = u),
                                          ((p = e).join = b),
                                          (p.using = Tb(v, d)),
                                          (r = t = p))
                                        : ((_a = r), (r = s));
                                    } else ((_a = r), (r = s));
                                  else ((_a = r), (r = s));
                                else ((_a = r), (r = s));
                              else ((_a = r), (r = s));
                            else ((_a = r), (r = s));
                          else ((_a = r), (r = s));
                        else ((_a = r), (r = s));
                      else ((_a = r), (r = s));
                    else ((_a = r), (r = s));
                    var b, p, v, d;
                    r === s &&
                      ((r = _a),
                      (t = Pi()) !== s &&
                      Zf() !== s &&
                      (e = Di()) !== s &&
                      Zf() !== s
                        ? ((n = Fi()) === s && (n = null),
                          n !== s
                            ? (r,
                              (t = (function (r, t, e) {
                                return ((t.join = r), (t.on = e), t);
                              })(t, e, n)),
                              (r = t))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)),
                      r === s &&
                        ((r = _a),
                        (t = Pi()) !== s &&
                        Zf() !== s &&
                        (e = Wf()) !== s &&
                        Zf() !== s &&
                        (n = Ha()) !== s &&
                        Zf() !== s &&
                        Vf() !== s &&
                        Zf() !== s
                          ? ((o = Ni()) === s && (o = null),
                            o !== s && (u = Zf()) !== s
                              ? ((a = Fi()) === s && (a = null),
                                a !== s
                                  ? (r,
                                    (t = (function (r, t, e, n) {
                                      return (
                                        (t.parentheses = !0),
                                        { expr: t, as: e, join: r, on: n }
                                      );
                                    })(t, n, o, a)),
                                    (r = t))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s))));
                    return r;
                  })()) !== s
                    ? (r, (r = t))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function Di() {
              var t, e, n, o, u, a;
              return (
                (t = _a),
                (e = (function () {
                  var t;
                  'dual' === r.substr(_a, 4).toLowerCase()
                    ? ((t = r.substr(_a, 4)), (_a += 4))
                    : ((t = s), 0 === Ra && Ua(Gu));
                  return t;
                })()) !== s && (t, (e = { type: 'dual' })),
                (t = e) === s &&
                  ((t = _a),
                  (e = Gi()) !== s && Zf() !== s
                    ? ((n = Ni()) === s && (n = null),
                      n !== s
                        ? (t,
                          (a = n),
                          (t = e =
                            'var' === (u = e).type
                              ? ((u.as = a), u)
                              : { db: u.db, table: u.table, as: a }))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    (e = Wf()) !== s &&
                    Zf() !== s &&
                    (n = Gi()) !== s &&
                    Zf() !== s &&
                    Vf() !== s &&
                    Zf() !== s
                      ? ((o = Ni()) === s && (o = null),
                        o !== s
                          ? (t,
                            (t = e =
                              (function (r, t, e) {
                                return 'var' === r.type
                                  ? ((r.as = e), (r.parentheses = !0), r)
                                  : {
                                      db: r.db,
                                      table: r.table,
                                      as: e,
                                      parentheses: !0,
                                    };
                              })(n, 0, o)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      (e = rc()) !== s && Zf() !== s
                        ? ((n = Ni()) === s && (n = null),
                          n !== s
                            ? (t,
                              (t = e =
                                (function (r, t) {
                                  return {
                                    expr: {
                                      type: 'values',
                                      values: r,
                                      prefix: 'row',
                                    },
                                    as: t,
                                  };
                                })(e, n)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = Wf()) !== s && Zf() !== s
                          ? ((n = Ha()) === s && (n = rc()),
                            n !== s && Zf() !== s && Vf() !== s && Zf() !== s
                              ? ((o = Ni()) === s && (o = null),
                                o !== s
                                  ? (t,
                                    (t = e =
                                      (function (r, t) {
                                        return (
                                          Array.isArray(r) &&
                                            (r = {
                                              type: 'values',
                                              values: r,
                                              prefix: 'row',
                                            }),
                                          (r.parentheses = !0),
                                          { expr: r, as: t }
                                        );
                                      })(n, o)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))))),
                t
              );
            }
            function Pi() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'left' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Xo)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })()) !== s && (n = Zf()) !== s
                  ? ((o = Ul()) === s && (o = null),
                    o !== s && Zf() !== s && kl() !== s
                      ? (t, (t = e = 'LEFT JOIN'))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      'right' === r.substr(_a, 5).toLowerCase()
                        ? ((e = r.substr(_a, 5)), (_a += 5))
                        : ((e = s), 0 === Ra && Ua(Ko)));
                    e !== s
                      ? ((n = _a),
                        Ra++,
                        (o = jc()),
                        Ra--,
                        o === s ? (n = void 0) : ((_a = n), (n = s)),
                        n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    return t;
                  })()) !== s && (n = Zf()) !== s
                    ? ((o = Ul()) === s && (o = null),
                      o !== s && Zf() !== s && kl() !== s
                        ? (t, (t = e = 'RIGHT JOIN'))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    (e = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'full' === r.substr(_a, 4).toLowerCase()
                          ? ((e = r.substr(_a, 4)), (_a += 4))
                          : ((e = s), 0 === Ra && Ua(Qo)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) !== s && (n = Zf()) !== s
                      ? ((o = Ul()) === s && (o = null),
                        o !== s && Zf() !== s && kl() !== s
                          ? (t, (t = e = 'FULL JOIN'))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'cross' === r.substr(_a, 5).toLowerCase()
                            ? ((e = r.substr(_a, 5)), (_a += 5))
                            : ((e = s), 0 === Ra && Ua(zo)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s &&
                      (n = Zf()) !== s &&
                      (o = kl()) !== s
                        ? (t, (t = e = 'CROSS JOIN'))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = _a),
                        (n = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'inner' === r.substr(_a, 5).toLowerCase()
                              ? ((e = r.substr(_a, 5)), (_a += 5))
                              : ((e = s), 0 === Ra && Ua(Zo)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })()) !== s && (o = Zf()) !== s
                          ? (e = n = [n, o])
                          : ((_a = e), (e = s)),
                        e === s && (e = null),
                        e !== s && (n = kl()) !== s
                          ? (t, (t = e = 'INNER JOIN'))
                          : ((_a = t), (t = s)))))),
                t
              );
            }
            function Gi() {
              var t, e, n, o, u, a, i, c, l;
              for (
                t = _a,
                  e = [],
                  qt.test(r.charAt(_a))
                    ? ((n = r.charAt(_a)), _a++)
                    : ((n = s), 0 === Ra && Ua(Xt));
                n !== s;

              )
                (e.push(n),
                  qt.test(r.charAt(_a))
                    ? ((n = r.charAt(_a)), _a++)
                    : ((n = s), 0 === Ra && Ua(Xt)));
              return (
                e !== s && (n = _c()) !== s
                  ? ((o = _a),
                    (u = Zf()) !== s &&
                    (a = Hf()) !== s &&
                    (i = Zf()) !== s &&
                    (c = _c()) !== s
                      ? (o = u = [u, a, i, c])
                      : ((_a = o), (o = s)),
                    o === s && (o = null),
                    o !== s
                      ? (t,
                        (t = e =
                          (function (r, t, e) {
                            const n = r ? `${r.join('')}${t}` : t,
                              o = { db: null, table: n };
                            return (
                              null !== e && ((o.db = n), (o.table = e[3])),
                              o
                            );
                          })(e, n, o)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = vb()) !== s &&
                    (t, ((l = e).db = null), (l.table = l.name), (e = l)),
                  (t = e)),
                t
              );
            }
            function Fi() {
              var r, t;
              return (
                (r = _a),
                jl() !== s &&
                Zf() !== s &&
                (t = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = ic()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s
                          ? ((u = Zl()) === s && (u = zl()),
                            u !== s && (a = Zf()) !== s && (i = ic()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s)))
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s
                          ? ((u = Zl()) === s && (u = zl()),
                            u !== s && (a = Zf()) !== s && (i = ic()) !== s
                              ? (n = o = [o, u, a, i])
                              : ((_a = n), (n = s)))
                          : ((_a = n), (n = s)));
                    e !== s
                      ? (r,
                        (t = (function (r, t) {
                          const e = t.length;
                          let n = r;
                          for (let r = 0; r < e; ++r)
                            n = Eb(t[r][1], n, t[r][3]);
                          return n;
                        })(t, e)),
                        (r = t))
                      : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function $i() {
              var t, e;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'where' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua(us)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                (e = cc()) !== s
                  ? (t, (t = e))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Hi() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = Tc()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Tc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Tc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function Yi() {
              var r, t;
              return (
                (r = _a),
                Al() !== s &&
                Zf() !== s &&
                Fl() !== s &&
                Zf() !== s &&
                (t = Ii()) !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Bi() {
              var t, e;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'order' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua(ls)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                Fl() !== s &&
                Zf() !== s &&
                (e = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = Wi()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = Wi()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = Wi()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)));
                    e !== s ? (r, (t = A(t, e)), (r = t)) : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s
                  ? (t, (t = e))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Wi() {
              var r, t, e;
              return (
                (r = _a),
                (t = ic()) !== s && Zf() !== s
                  ? ((e = Hl()) === s && (e = $l()),
                    e === s && (e = null),
                    e !== s
                      ? (r, (r = t = { expr: t, type: e }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Vi() {
              var t, e;
              return (
                (t = el()) === s &&
                  (t = Mc()) === s &&
                  ((t = _a),
                  63 === r.charCodeAt(_a)
                    ? ((e = '?'), _a++)
                    : ((e = s), 0 === Ra && Ua(Kt)),
                  e !== s && (t, (e = { type: 'origin', value: '?' })),
                  (t = e)),
                t
              );
            }
            function qi() {
              var t, e, n, o, u, a;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'limit' === r.substr(_a, 5).toLowerCase()
                      ? ((e = r.substr(_a, 5)), (_a += 5))
                      : ((e = s), 0 === Ra && Ua(bs)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                (e = Vi()) !== s &&
                Zf() !== s
                  ? ((n = _a),
                    (o = Yf()) === s &&
                      (o = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'offset' === r.substr(_a, 6).toLowerCase()
                            ? ((e = r.substr(_a, 6)), (_a += 6))
                            : ((e = s), 0 === Ra && Ua(ps)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s
                              ? (t, (t = e = 'OFFSET'))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()),
                    o !== s && (u = Zf()) !== s && (a = Vi()) !== s
                      ? (n = o = [o, u, a])
                      : ((_a = n), (n = s)),
                    n === s && (n = null),
                    n !== s
                      ? (t,
                        (t = (function (r, t) {
                          const e = [r];
                          return (
                            t && e.push(t[2]),
                            {
                              seperator:
                                (t && t[0] && t[0].toLowerCase()) || '',
                              value: e,
                            }
                          );
                        })(e, n)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Xi() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = Ki()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Ki()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Ki()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function Ki() {
              var t, e, n, o, u, a, i, c, l;
              return (
                (t = _a),
                (e = _a),
                (n = _c()) !== s && (o = Zf()) !== s && (u = Hf()) !== s
                  ? (e = n = [n, o, u])
                  : ((_a = e), (e = s)),
                e === s && (e = null),
                e !== s &&
                (n = Zf()) !== s &&
                (o = gc()) !== s &&
                (u = Zf()) !== s
                  ? (61 === r.charCodeAt(_a)
                      ? ((a = '='), _a++)
                      : ((a = s), 0 === Ra && Ua(Qt)),
                    a !== s && Zf() !== s && (i = Lc()) !== s
                      ? (t,
                        (t = e =
                          { column: o, value: i, table: (l = e) && l[0] }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = _a),
                  (n = _c()) !== s && (o = Zf()) !== s && (u = Hf()) !== s
                    ? (e = n = [n, o, u])
                    : ((_a = e), (e = s)),
                  e === s && (e = null),
                  e !== s &&
                  (n = Zf()) !== s &&
                  (o = gc()) !== s &&
                  (u = Zf()) !== s
                    ? (61 === r.charCodeAt(_a)
                        ? ((a = '='), _a++)
                        : ((a = s), 0 === Ra && Ua(Qt)),
                      a !== s &&
                      Zf() !== s &&
                      (i = Ml()) !== s &&
                      Zf() !== s &&
                      Wf() !== s &&
                      Zf() !== s &&
                      (c = Tc()) !== s &&
                      Zf() !== s &&
                      Vf() !== s
                        ? (t,
                          (t = e =
                            (function (r, t, e) {
                              return {
                                column: t,
                                value: e,
                                table: r && r[0],
                                keyword: 'values',
                              };
                            })(e, o, c)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function Qi() {
              var r;
              return ((r = rc()) === s && (r = Ai()), r);
            }
            function Zi() {
              var r, t, e, n, o, u, a, i, c;
              if (((r = _a), Al() !== s))
                if (Zf() !== s)
                  if ((t = Wf()) !== s)
                    if (Zf() !== s)
                      if ((e = xc()) !== s) {
                        for (
                          n = [],
                            o = _a,
                            (u = Zf()) !== s &&
                            (a = Yf()) !== s &&
                            (i = Zf()) !== s &&
                            (c = xc()) !== s
                              ? (o = u = [u, a, i, c])
                              : ((_a = o), (o = s));
                          o !== s;

                        )
                          (n.push(o),
                            (o = _a),
                            (u = Zf()) !== s &&
                            (a = Yf()) !== s &&
                            (i = Zf()) !== s &&
                            (c = xc()) !== s
                              ? (o = u = [u, a, i, c])
                              : ((_a = o), (o = s)));
                        n !== s && (o = Zf()) !== s && (u = Vf()) !== s
                          ? (r, (r = yt(e, n)))
                          : ((_a = r), (r = s));
                      } else ((_a = r), (r = s));
                    else ((_a = r), (r = s));
                  else ((_a = r), (r = s));
                else ((_a = r), (r = s));
              else ((_a = r), (r = s));
              return (
                r === s &&
                  ((r = _a),
                  Al() !== s && Zf() !== s && (t = tc()) !== s
                    ? (r, (r = t))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function zi() {
              var t, e, n;
              return (
                (t = _a),
                jl() !== s && Zf() !== s
                  ? ('duplicate' === r.substr(_a, 9).toLowerCase()
                      ? ((e = r.substr(_a, 9)), (_a += 9))
                      : ((e = s), 0 === Ra && Ua(Zt)),
                    e !== s &&
                    Zf() !== s &&
                    Uf() !== s &&
                    Zf() !== s &&
                    dl() !== s &&
                    Zf() !== s &&
                    (n = Xi()) !== s
                      ? (t,
                        (t = { keyword: 'on duplicate key update', set: n }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ji() {
              var r, t;
              return (
                (r = _a),
                (t = Cl()) !== s && (r, (t = 'insert')),
                (r = t) === s &&
                  ((r = _a), (t = hl()) !== s && (r, (t = 'replace')), (r = t)),
                r
              );
            }
            function rc() {
              var r, t;
              return (
                (r = _a),
                Ml() !== s &&
                Zf() !== s &&
                (t = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = tc()) !== s)) {
                    for (
                      e = [],
                        n = _a,
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = tc()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s));
                      n !== s;

                    )
                      (e.push(n),
                        (n = _a),
                        (o = Zf()) !== s &&
                        (u = Yf()) !== s &&
                        (a = Zf()) !== s &&
                        (i = tc()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)));
                    e !== s ? (r, (t = A(t, e)), (r = t)) : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) !== s
                  ? (r, (r = t))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function tc() {
              var t, e, n;
              return (
                (t = _a),
                'row' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(j)),
                e === s && (e = null),
                e !== s &&
                Zf() !== s &&
                Wf() !== s &&
                Zf() !== s &&
                (n = ec()) !== s &&
                Zf() !== s &&
                Vf() !== s
                  ? (t, (t = e = n))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ec() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = ic()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = ic()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = ic()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s
                  ? (r,
                    (r = t =
                      (function (r, t) {
                        const e = { type: 'expr_list' };
                        return ((e.value = Tb(r, t)), e);
                      })(t, e)))
                  : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function nc() {
              var t, e, n;
              return (
                (t = _a),
                Tf() !== s &&
                Zf() !== s &&
                (e = ic()) !== s &&
                Zf() !== s &&
                (n = (function () {
                  var t;
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      'year' === r.substr(_a, 4).toLowerCase()
                        ? ((e = r.substr(_a, 4)), (_a += 4))
                        : ((e = s), 0 === Ra && Ua(Nn)));
                    e !== s
                      ? ((n = _a),
                        Ra++,
                        (o = jc()),
                        Ra--,
                        o === s ? (n = void 0) : ((_a = n), (n = s)),
                        n !== s ? (t, (t = e = 'YEAR')) : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    return t;
                  })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'quarter' === r.substr(_a, 7).toLowerCase()
                          ? ((e = r.substr(_a, 7)), (_a += 7))
                          : ((e = s), 0 === Ra && Ua(An)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'QUARTER'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'month' === r.substr(_a, 5).toLowerCase()
                          ? ((e = r.substr(_a, 5)), (_a += 5))
                          : ((e = s), 0 === Ra && Ua(En)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'MONTH'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'week' === r.substr(_a, 4).toLowerCase()
                          ? ((e = r.substr(_a, 4)), (_a += 4))
                          : ((e = s), 0 === Ra && Ua(Sn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t, (t = e = 'WEEK')) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'day' === r.substr(_a, 3).toLowerCase()
                          ? ((e = r.substr(_a, 3)), (_a += 3))
                          : ((e = s), 0 === Ra && Ua(an)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t, (t = e = 'DAY')) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'hour' === r.substr(_a, 4).toLowerCase()
                          ? ((e = r.substr(_a, 4)), (_a += 4))
                          : ((e = s), 0 === Ra && Ua(vn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t, (t = e = 'HOUR')) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'minute' === r.substr(_a, 6).toLowerCase()
                          ? ((e = r.substr(_a, 6)), (_a += 6))
                          : ((e = s), 0 === Ra && Ua(mn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'MINUTE'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'second' === r.substr(_a, 6).toLowerCase()
                          ? ((e = r.substr(_a, 6)), (_a += 6))
                          : ((e = s), 0 === Ra && Ua(Tn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'SECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'microsecond' === r.substr(_a, 11).toLowerCase()
                          ? ((e = r.substr(_a, 11)), (_a += 11))
                          : ((e = s), 0 === Ra && Ua(wu)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'MICROSECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'second_microsecond' === r.substr(_a, 18).toLowerCase()
                          ? ((e = r.substr(_a, 18)), (_a += 18))
                          : ((e = s), 0 === Ra && Ua(nn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'SECOND_MICROSECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'minute_microsecond' === r.substr(_a, 18).toLowerCase()
                          ? ((e = r.substr(_a, 18)), (_a += 18))
                          : ((e = s), 0 === Ra && Ua(en)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'MINUTE_MICROSECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'minute_second' === r.substr(_a, 13).toLowerCase()
                          ? ((e = r.substr(_a, 13)), (_a += 13))
                          : ((e = s), 0 === Ra && Ua(tn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'MINUTE_SECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'hour_microsecond' === r.substr(_a, 16).toLowerCase()
                          ? ((e = r.substr(_a, 16)), (_a += 16))
                          : ((e = s), 0 === Ra && Ua(rn)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'HOUR_MICROSECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'hour_second' === r.substr(_a, 11).toLowerCase()
                          ? ((e = r.substr(_a, 11)), (_a += 11))
                          : ((e = s), 0 === Ra && Ua(Je)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'HOUR_SECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'hour_minute' === r.substr(_a, 11).toLowerCase()
                          ? ((e = r.substr(_a, 11)), (_a += 11))
                          : ((e = s), 0 === Ra && Ua(ze)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'HOUR_MINUTE'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'day_microsecond' === r.substr(_a, 15).toLowerCase()
                          ? ((e = r.substr(_a, 15)), (_a += 15))
                          : ((e = s), 0 === Ra && Ua(Ze)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'DAY_MICROSECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'day_second' === r.substr(_a, 10).toLowerCase()
                          ? ((e = r.substr(_a, 10)), (_a += 10))
                          : ((e = s), 0 === Ra && Ua(Qe)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'DAY_SECOND'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'day_minute' === r.substr(_a, 10).toLowerCase()
                          ? ((e = r.substr(_a, 10)), (_a += 10))
                          : ((e = s), 0 === Ra && Ua(Ke)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'DAY_MINUTE'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'day_hour' === r.substr(_a, 8).toLowerCase()
                          ? ((e = r.substr(_a, 8)), (_a += 8))
                          : ((e = s), 0 === Ra && Ua(Xe)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'DAY_HOUR'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        'year_month' === r.substr(_a, 10).toLowerCase()
                          ? ((e = r.substr(_a, 10)), (_a += 10))
                          : ((e = s), 0 === Ra && Ua(qe)));
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s
                            ? (t, (t = e = 'YEAR_MONTH'))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })());
                  return t;
                })()) !== s
                  ? (t,
                    (t = { type: 'interval', expr: e, unit: n.toLowerCase() }))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function oc() {
              var r, t, e, n, o, u;
              if (((r = _a), (t = sc()) !== s))
                if (Zf() !== s) {
                  for (
                    e = [],
                      n = _a,
                      (o = Zf()) !== s && (u = sc()) !== s
                        ? (n = o = [o, u])
                        : ((_a = n), (n = s));
                    n !== s;

                  )
                    (e.push(n),
                      (n = _a),
                      (o = Zf()) !== s && (u = sc()) !== s
                        ? (n = o = [o, u])
                        : ((_a = n), (n = s)));
                  e !== s ? (r, (r = t = c(t, e))) : ((_a = r), (r = s));
                } else ((_a = r), (r = s));
              else ((_a = r), (r = s));
              return r;
            }
            function sc() {
              var t, e, n;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'when' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Ms)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                (e = cc()) !== s &&
                Zf() !== s &&
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'then' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Ds)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                (n = ic()) !== s
                  ? (t, (t = { type: 'when', cond: e, result: n }))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function uc() {
              var t, e;
              return (
                (t = _a),
                (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'else' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Ps)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })() !== s &&
                Zf() !== s &&
                (e = ic()) !== s
                  ? (t, (t = { type: 'else', result: e }))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ac() {
              var r;
              return (
                (r = (function () {
                  var r, t, e, n, o, u, a, i;
                  if (((r = _a), (t = Ac()) !== s)) {
                    if (
                      ((e = []),
                      (n = _a),
                      (o = Zf()) !== s &&
                      (u = Qf()) !== s &&
                      (a = Zf()) !== s &&
                      (i = Ac()) !== s
                        ? (n = o = [o, u, a, i])
                        : ((_a = n), (n = s)),
                      n !== s)
                    )
                      for (; n !== s; )
                        (e.push(n),
                          (n = _a),
                          (o = Zf()) !== s &&
                          (u = Qf()) !== s &&
                          (a = Zf()) !== s &&
                          (i = Ac()) !== s
                            ? (n = o = [o, u, a, i])
                            : ((_a = n), (n = s)));
                    else e = s;
                    e !== s && (n = Zf()) !== s
                      ? ((o = pc()) === s && (o = null),
                        o !== s
                          ? (r,
                            (t = (function (r, t, e) {
                              const n = Ib(r, t);
                              return null === e
                                ? n
                                : 'arithmetic' === e.type
                                  ? Ib(n, e.tail)
                                  : Eb(e.op, n, e.right);
                            })(t, e, o)),
                            (r = t))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                  return r;
                })()) === s &&
                  (r = (function () {
                    var r, t, e, n, o, u, a, i;
                    if (((r = _a), (t = lc()) !== s)) {
                      for (
                        e = [],
                          n = _a,
                          (o = zf()) !== s &&
                          (u = zl()) !== s &&
                          (a = Zf()) !== s &&
                          (i = lc()) !== s
                            ? (n = o = [o, u, a, i])
                            : ((_a = n), (n = s));
                        n !== s;

                      )
                        (e.push(n),
                          (n = _a),
                          (o = zf()) !== s &&
                          (u = zl()) !== s &&
                          (a = Zf()) !== s &&
                          (i = lc()) !== s
                            ? (n = o = [o, u, a, i])
                            : ((_a = n), (n = s)));
                      e !== s
                        ? (r, (t = zt(t, e)), (r = t))
                        : ((_a = r), (r = s));
                    } else ((_a = r), (r = s));
                    return r;
                  })()),
                r
              );
            }
            function ic() {
              var r;
              return ((r = ac()) === s && (r = Ha()), r);
            }
            function cc() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = ic()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s
                      ? ((u = Zl()) === s && (u = zl()) === s && (u = Yf()),
                        u !== s && (a = Zf()) !== s && (i = ic()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)))
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s
                      ? ((u = Zl()) === s && (u = zl()) === s && (u = Yf()),
                        u !== s && (a = Zf()) !== s && (i = ic()) !== s
                          ? (n = o = [o, u, a, i])
                          : ((_a = n), (n = s)))
                      : ((_a = n), (n = s)));
                e !== s
                  ? (r,
                    (r = t =
                      (function (r, t) {
                        const e = t.length;
                        let n = r,
                          o = '';
                        for (let r = 0; r < e; ++r)
                          ',' === t[r][1]
                            ? ((o = ','),
                              Array.isArray(n) || (n = [n]),
                              n.push(t[r][3]))
                            : (n = Eb(t[r][1], n, t[r][3]));
                        if (',' === o) {
                          const r = { type: 'expr_list' };
                          return ((r.value = n), r);
                        }
                        return n;
                      })(t, e)))
                  : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function lc() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = fc()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = zf()) !== s &&
                    (u = Zl()) !== s &&
                    (a = Zf()) !== s &&
                    (i = fc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = zf()) !== s &&
                    (u = Zl()) !== s &&
                    (a = Zf()) !== s &&
                    (i = fc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = Ib(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function fc() {
              var r, t;
              return (
                (r = bc()) === s &&
                  (r = (function () {
                    var r, t, e;
                    ((r = _a),
                      (t = (function () {
                        var r, t, e, n, o;
                        ((r = _a),
                          (t = _a),
                          (e = Ql()) !== s &&
                          (n = Zf()) !== s &&
                          (o = Kl()) !== s
                            ? (t = e = [e, n, o])
                            : ((_a = t), (t = s)));
                        t !== s && (r, (t = Jt(t)));
                        (r = t) === s && (r = Kl());
                        return r;
                      })()) !== s &&
                      Zf() !== s &&
                      Wf() !== s &&
                      Zf() !== s &&
                      (e = Ha()) !== s &&
                      Zf() !== s &&
                      Vf() !== s
                        ? (r,
                          (n = t),
                          ((o = e).parentheses = !0),
                          (t = mb(n, o)),
                          (r = t))
                        : ((_a = r), (r = s)));
                    var n, o;
                    return r;
                  })()) === s &&
                  ((r = _a),
                  Ql() !== s && Zf() !== s && (t = fc()) !== s
                    ? (r, (r = mb('NOT', t)))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function bc() {
              var r, t, e, n, o;
              return (
                (r = _a),
                (t = Lc()) !== s && Zf() !== s
                  ? ((e = pc()) === s && (e = null),
                    e !== s
                      ? (r,
                        (n = t),
                        (r = t =
                          null === (o = e)
                            ? n
                            : 'arithmetic' === o.type
                              ? Ib(n, o.tail)
                              : Eb(o.op, n, o.right)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r === s && (r = zc()) === s && (r = Tc()),
                r
              );
            }
            function pc() {
              var t;
              return (
                (t = (function () {
                  var r, t, e, n, o, u, a;
                  ((r = _a),
                    (t = []),
                    (e = _a),
                    (n = Zf()) !== s &&
                    (o = vc()) !== s &&
                    (u = Zf()) !== s &&
                    (a = Lc()) !== s
                      ? (e = n = [n, o, u, a])
                      : ((_a = e), (e = s)));
                  if (e !== s)
                    for (; e !== s; )
                      (t.push(e),
                        (e = _a),
                        (n = Zf()) !== s &&
                        (o = vc()) !== s &&
                        (u = Zf()) !== s &&
                        (a = Lc()) !== s
                          ? (e = n = [n, o, u, a])
                          : ((_a = e), (e = s)));
                  else t = s;
                  t !== s && (r, (t = { type: 'arithmetic', tail: t }));
                  return (r = t);
                })()) === s &&
                  (t = wc()) === s &&
                  (t = (function () {
                    var r, t, e, n;
                    ((r = _a),
                      (t = (function () {
                        var r, t, e, n, o;
                        ((r = _a),
                          (t = _a),
                          (e = Ql()) !== s &&
                          (n = Zf()) !== s &&
                          (o = Wl()) !== s
                            ? (t = e = [e, n, o])
                            : ((_a = t), (t = s)));
                        t !== s && (r, (t = Jt(t)));
                        (r = t) === s && (r = Wl());
                        return r;
                      })()) !== s &&
                      Zf() !== s &&
                      (e = Lc()) !== s &&
                      Zf() !== s &&
                      Zl() !== s &&
                      Zf() !== s &&
                      (n = Lc()) !== s
                        ? (r,
                          (r = t =
                            {
                              op: t,
                              right: { type: 'expr_list', value: [e, n] },
                            }))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (t = (function () {
                    var r, t, e, n, o;
                    ((r = _a),
                      (t = ql()) !== s && (e = Zf()) !== s && (n = Lc()) !== s
                        ? (r, (r = t = { op: 'IS', right: n }))
                        : ((_a = r), (r = s)));
                    r === s &&
                      ((r = _a),
                      (t = _a),
                      (e = ql()) !== s && (n = Zf()) !== s && (o = Ql()) !== s
                        ? (t = e = [e, n, o])
                        : ((_a = t), (t = s)),
                      t !== s && (e = Zf()) !== s && (n = Lc()) !== s
                        ? (r,
                          (t = (function (r) {
                            return { op: 'IS NOT', right: r };
                          })(n)),
                          (r = t))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (t = yc()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n;
                        ((t = _a), (e = Ql()) === s && (e = null));
                        e !== s && Zf() !== s
                          ? ((n = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'regexp' === r.substr(_a, 6).toLowerCase()
                                  ? ((e = r.substr(_a, 6)), (_a += 6))
                                  : ((e = s), 0 === Ra && Ua(As)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'REGEXP'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s &&
                              (n = (function () {
                                var t, e, n, o;
                                ((t = _a),
                                  'rlike' === r.substr(_a, 5).toLowerCase()
                                    ? ((e = r.substr(_a, 5)), (_a += 5))
                                    : ((e = s), 0 === Ra && Ua(Es)));
                                e !== s
                                  ? ((n = _a),
                                    Ra++,
                                    (o = jc()),
                                    Ra--,
                                    o === s
                                      ? (n = void 0)
                                      : ((_a = n), (n = s)),
                                    n !== s
                                      ? (t, (t = e = 'RLIKE'))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s));
                                return t;
                              })()),
                            n !== s
                              ? (t,
                                (u = n),
                                (t = e = (o = e) ? `${o} ${u}` : u))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        var o, u;
                        return t;
                      })()) !== s && Zf() !== s
                        ? ('binary' === r.substr(_a, 6).toLowerCase()
                            ? ((n = r.substr(_a, 6)), (_a += 6))
                            : ((n = s), 0 === Ra && Ua(Xr)),
                          n === s && (n = null),
                          n !== s && Zf() !== s
                            ? ((o = Xc()) === s &&
                                (o = zc()) === s &&
                                (o = Tc()),
                              o !== s
                                ? (t,
                                  (u = e),
                                  (t = e =
                                    {
                                      op: (a = n) ? `${u} ${a}` : u,
                                      right: o,
                                    }))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)));
                    var u, a;
                    return t;
                  })()),
                t
              );
            }
            function vc() {
              var t;
              return (
                '>=' === r.substr(_a, 2)
                  ? ((t = '>='), (_a += 2))
                  : ((t = s), 0 === Ra && Ua(re)),
                t === s &&
                  (62 === r.charCodeAt(_a)
                    ? ((t = '>'), _a++)
                    : ((t = s), 0 === Ra && Ua(te)),
                  t === s &&
                    ('<=' === r.substr(_a, 2)
                      ? ((t = '<='), (_a += 2))
                      : ((t = s), 0 === Ra && Ua(ee)),
                    t === s &&
                      ('<>' === r.substr(_a, 2)
                        ? ((t = '<>'), (_a += 2))
                        : ((t = s), 0 === Ra && Ua(ne)),
                      t === s &&
                        (60 === r.charCodeAt(_a)
                          ? ((t = '<'), _a++)
                          : ((t = s), 0 === Ra && Ua(oe)),
                        t === s &&
                          (61 === r.charCodeAt(_a)
                            ? ((t = '='), _a++)
                            : ((t = s), 0 === Ra && Ua(Qt)),
                          t === s &&
                            ('!=' === r.substr(_a, 2)
                              ? ((t = '!='), (_a += 2))
                              : ((t = s), 0 === Ra && Ua(se)))))))),
                t
              );
            }
            function dc() {
              var r, t, e, n, o;
              return (
                (r = _a),
                (t = _a),
                (e = Ql()) !== s && (n = Zf()) !== s && (o = Vl()) !== s
                  ? (t = e = [e, n, o])
                  : ((_a = t), (t = s)),
                t !== s && (r, (t = Jt(t))),
                (r = t) === s && (r = Vl()),
                r
              );
            }
            function yc() {
              var t, e, n, o, u, a, i, c, l, f;
              return (
                (t = _a),
                (e = (function () {
                  var r, t, e, n, o;
                  return (
                    (r = _a),
                    (t = _a),
                    (e = Ql()) !== s && (n = Zf()) !== s && (o = Xl()) !== s
                      ? (t = e = [e, n, o])
                      : ((_a = t), (t = s)),
                    t !== s && (r, (t = Jt(t))),
                    (r = t) === s && (r = Xl()),
                    r
                  );
                })()) !== s && Zf() !== s
                  ? ((n = Qc()) === s && (n = Mc()) === s && (n = bc()),
                    n !== s && Zf() !== s
                      ? ((o = _a),
                        (u = Zf()) !== s && (a = Ka()) !== s
                          ? (o = u = [u, a])
                          : ((_a = o), (o = s)),
                        o === s && (o = null),
                        o !== s && (u = Zf()) !== s
                          ? ((a = (function () {
                              var t, e, n;
                              return (
                                (t = _a),
                                'escape' === r.substr(_a, 6).toLowerCase()
                                  ? ((e = r.substr(_a, 6)), (_a += 6))
                                  : ((e = s), 0 === Ra && Ua(ue)),
                                e !== s && Zf() !== s && (n = zc()) !== s
                                  ? (t, (t = e = { type: 'ESCAPE', value: n }))
                                  : ((_a = t), (t = s)),
                                t
                              );
                            })()) === s && (a = null),
                            a !== s
                              ? (t,
                                (i = e),
                                (c = n),
                                (l = o),
                                (f = a) && (c.escape = f),
                                l && (c.suffix = { collate: l[1] }),
                                (t = e = { op: i, right: c }))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function wc() {
              var r, t, e, n;
              return (
                (r = _a),
                (t = dc()) !== s &&
                Zf() !== s &&
                (e = Wf()) !== s &&
                Zf() !== s &&
                (n = ec()) !== s &&
                Zf() !== s &&
                Vf() !== s
                  ? (r, (r = t = { op: t, right: n }))
                  : ((_a = r), (r = s)),
                r === s &&
                  ((r = _a),
                  (t = dc()) !== s && Zf() !== s
                    ? ((e = vb()) === s && (e = Tc()) === s && (e = zc()),
                      e !== s
                        ? (r,
                          (r = t =
                            (function (r, t) {
                              return { op: r, right: t };
                            })(t, e)))
                        : ((_a = r), (r = s)))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function Lc() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = hc()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Cc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = hc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Cc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = hc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = zt(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function Cc() {
              var t;
              return (
                43 === r.charCodeAt(_a)
                  ? ((t = '+'), _a++)
                  : ((t = s), 0 === Ra && Ua(ae)),
                t === s &&
                  (45 === r.charCodeAt(_a)
                    ? ((t = '-'), _a++)
                    : ((t = s), 0 === Ra && Ua(ie))),
                t
              );
            }
            function hc() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = Ec()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = mc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Ec()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = mc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Ec()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = Ib(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function mc() {
              var t, e;
              return (
                42 === r.charCodeAt(_a)
                  ? ((t = '*'), _a++)
                  : ((t = s), 0 === Ra && Ua(ce)),
                t === s &&
                  (47 === r.charCodeAt(_a)
                    ? ((t = '/'), _a++)
                    : ((t = s), 0 === Ra && Ua(le)),
                  t === s &&
                    (37 === r.charCodeAt(_a)
                      ? ((t = '%'), _a++)
                      : ((t = s), 0 === Ra && Ua(fe)),
                    t === s &&
                      ('||' === r.substr(_a, 2)
                        ? ((t = '||'), (_a += 2))
                        : ((t = s), 0 === Ra && Ua(be)),
                      t === s &&
                        ((t = _a),
                        'div' === r.substr(_a, 3).toLowerCase()
                          ? ((e = r.substr(_a, 3)), (_a += 3))
                          : ((e = s), 0 === Ra && Ua(pe)),
                        e !== s && (t, (e = 'DIV')),
                        (t = e) === s &&
                          (38 === r.charCodeAt(_a)
                            ? ((t = '&'), _a++)
                            : ((t = s), 0 === Ra && Ua(ve)),
                          t === s &&
                            ('>>' === r.substr(_a, 2)
                              ? ((t = '>>'), (_a += 2))
                              : ((t = s), 0 === Ra && Ua(de)),
                            t === s &&
                              ('<<' === r.substr(_a, 2)
                                ? ((t = '<<'), (_a += 2))
                                : ((t = s), 0 === Ra && Ua(ye)),
                              t === s &&
                                (94 === r.charCodeAt(_a)
                                  ? ((t = '^'), _a++)
                                  : ((t = s), 0 === Ra && Ua(we)),
                                t === s &&
                                  (124 === r.charCodeAt(_a)
                                    ? ((t = '|'), _a++)
                                    : ((t = s), 0 === Ra && Ua(Le))))))))))),
                t
              );
            }
            function Ec() {
              var t, e, n, o, u;
              return (
                (t = Ac()) === s &&
                  ((t = _a),
                  (e = (function () {
                    var t;
                    33 === r.charCodeAt(_a)
                      ? ((t = '!'), _a++)
                      : ((t = s), 0 === Ra && Ua(Ce));
                    t === s &&
                      (45 === r.charCodeAt(_a)
                        ? ((t = '-'), _a++)
                        : ((t = s), 0 === Ra && Ua(ie)),
                      t === s &&
                        (43 === r.charCodeAt(_a)
                          ? ((t = '+'), _a++)
                          : ((t = s), 0 === Ra && Ua(ae)),
                        t === s &&
                          (126 === r.charCodeAt(_a)
                            ? ((t = '~'), _a++)
                            : ((t = s), 0 === Ra && Ua(he)))));
                    return t;
                  })()) !== s
                    ? ((n = _a),
                      (o = Zf()) !== s && (u = Ec()) !== s
                        ? (n = o = [o, u])
                        : ((_a = n), (n = s)),
                      n !== s
                        ? (t, (t = e = mb(e, n[1])))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function Ac() {
              var t, e, n, o;
              return (
                (t = (function () {
                  var t, e, n, o, u, a, i;
                  ((t = _a),
                    (e = ef()) !== s &&
                    Zf() !== s &&
                    Wf() !== s &&
                    Zf() !== s &&
                    (n = ic()) !== s &&
                    Zf() !== s &&
                    Sl() !== s &&
                    Zf() !== s &&
                    (o = wb()) !== s &&
                    Zf() !== s &&
                    (u = ai()) !== s &&
                    Zf() !== s &&
                    (a = xc()) !== s &&
                    Zf() !== s &&
                    Vf() !== s &&
                    Zf() !== s
                      ? ((i = Ka()) === s && (i = null),
                        i !== s
                          ? (t,
                            (e = (function (r, t, e, n, o, s) {
                              const { dataType: u, length: a } = e;
                              let i = u;
                              return (
                                void 0 !== a && (i = `${i}(${a})`),
                                {
                                  type: 'cast',
                                  keyword: r.toLowerCase(),
                                  expr: t,
                                  symbol: 'as',
                                  target: {
                                    dataType: `${i} ${n} ${o.toUpperCase()}`,
                                  },
                                  collate: s,
                                }
                              );
                            })(e, n, o, u, a, i)),
                            (t = e))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)));
                  t === s &&
                    ((t = _a),
                    (e = ef()) !== s &&
                    Zf() !== s &&
                    Wf() !== s &&
                    Zf() !== s &&
                    (n = ic()) !== s &&
                    Zf() !== s &&
                    Sl() !== s &&
                    Zf() !== s &&
                    (o = yb()) !== s &&
                    Zf() !== s &&
                    (u = Vf()) !== s
                      ? (t,
                        (c = n),
                        (l = o),
                        (e = {
                          type: 'cast',
                          keyword: e.toLowerCase(),
                          expr: c,
                          symbol: 'as',
                          target: l,
                        }),
                        (t = e))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      (e = ef()) !== s &&
                      Zf() !== s &&
                      Wf() !== s &&
                      Zf() !== s &&
                      (n = ic()) !== s &&
                      Zf() !== s &&
                      Sl() !== s &&
                      Zf() !== s &&
                      (o = af()) !== s &&
                      Zf() !== s &&
                      (u = Wf()) !== s &&
                      Zf() !== s &&
                      (a = nl()) !== s &&
                      Zf() !== s &&
                      Vf() !== s &&
                      Zf() !== s &&
                      (i = Vf()) !== s
                        ? (t,
                          (e = (function (r, t, e) {
                            return {
                              type: 'cast',
                              keyword: r.toLowerCase(),
                              expr: t,
                              symbol: 'as',
                              target: { dataType: 'DECIMAL(' + e + ')' },
                            };
                          })(e, n, a)),
                          (t = e))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = ef()) !== s &&
                        Zf() !== s &&
                        Wf() !== s &&
                        Zf() !== s &&
                        (n = ic()) !== s &&
                        Zf() !== s &&
                        Sl() !== s &&
                        Zf() !== s &&
                        (o = af()) !== s &&
                        Zf() !== s &&
                        (u = Wf()) !== s &&
                        Zf() !== s &&
                        (a = nl()) !== s &&
                        Zf() !== s &&
                        Yf() !== s &&
                        Zf() !== s &&
                        (i = nl()) !== s &&
                        Zf() !== s &&
                        Vf() !== s &&
                        Zf() !== s &&
                        Vf() !== s
                          ? (t,
                            (e = (function (r, t, e, n) {
                              return {
                                type: 'cast',
                                keyword: r.toLowerCase(),
                                expr: t,
                                symbol: 'as',
                                target: {
                                  dataType: 'DECIMAL(' + e + ', ' + n + ')',
                                },
                              };
                            })(e, n, a, i)),
                            (t = e))
                          : ((_a = t), (t = s)),
                        t === s &&
                          ((t = _a),
                          (e = ef()) !== s &&
                          Zf() !== s &&
                          Wf() !== s &&
                          Zf() !== s &&
                          (n = ic()) !== s &&
                          Zf() !== s &&
                          Sl() !== s &&
                          Zf() !== s &&
                          (o = (function () {
                            var t;
                            (t = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'signed' === r.substr(_a, 6).toLowerCase()
                                  ? ((e = r.substr(_a, 6)), (_a += 6))
                                  : ((e = s), 0 === Ra && Ua(qs)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'SIGNED'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s && (t = cf());
                            return t;
                          })()) !== s &&
                          Zf() !== s
                            ? ((u = ff()) === s && (u = null),
                              u !== s && Zf() !== s && (a = Vf()) !== s
                                ? (t,
                                  (e = (function (r, t, e, n) {
                                    return {
                                      type: 'cast',
                                      keyword: r.toLowerCase(),
                                      expr: t,
                                      symbol: 'as',
                                      target: {
                                        dataType: e + (n ? ' ' + n : ''),
                                      },
                                    };
                                  })(e, n, o, u)),
                                  (t = e))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s))))));
                  var c, l;
                  return t;
                })()) === s &&
                  (t = Qc()) === s &&
                  (t = _i()) === s &&
                  (t = (function () {
                    var t;
                    (t = (function () {
                      var t, e, n, o;
                      ((t = _a),
                        (e = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'count' === r.substr(_a, 5).toLowerCase()
                              ? ((e = r.substr(_a, 5)), (_a += 5))
                              : ((e = s), 0 === Ra && Ua(Ss)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'COUNT'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })()) === s &&
                          (e = (function () {
                            var t, e, n, o;
                            ((t = _a),
                              'group_concat' === r.substr(_a, 12).toLowerCase()
                                ? ((e = r.substr(_a, 12)), (_a += 12))
                                : ((e = s), 0 === Ra && Ua(Ns)));
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'GROUP_CONCAT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s));
                            return t;
                          })()));
                      e !== s &&
                      Zf() !== s &&
                      Wf() !== s &&
                      Zf() !== s &&
                      (n = (function () {
                        var t, e, n, o, u, a, i;
                        ((t = _a),
                          (e = (function () {
                            var t, e;
                            ((t = _a),
                              42 === r.charCodeAt(_a)
                                ? ((e = '*'), _a++)
                                : ((e = s), 0 === Ra && Ua(ce)));
                            e !== s && (t, (e = { type: 'star', value: '*' }));
                            return (t = e);
                          })()) !== s && (t, (e = { expr: e })));
                        (t = e) === s &&
                          ((t = _a),
                          (e = Bl()) === s && (e = null),
                          e !== s &&
                          Zf() !== s &&
                          (n = Wf()) !== s &&
                          Zf() !== s &&
                          (o = ic()) !== s &&
                          Zf() !== s &&
                          (u = Vf()) !== s &&
                          Zf() !== s
                            ? ((a = Bi()) === s && (a = null),
                              a !== s && Zf() !== s
                                ? ((i = Wc()) === s && (i = null),
                                  i !== s
                                    ? (t,
                                      (t = e =
                                        {
                                          distinct: e,
                                          expr: o,
                                          orderby: a,
                                          parentheses: !0,
                                          separator: i,
                                        }))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t === s &&
                            ((t = _a),
                            (e = Bl()) === s && (e = null),
                            e !== s &&
                            Zf() !== s &&
                            (n = ic()) !== s &&
                            Zf() !== s
                              ? ((o = Bi()) === s && (o = null),
                                o !== s && Zf() !== s
                                  ? ((u = Wc()) === s && (u = null),
                                    u !== s
                                      ? (t,
                                        (e = (function (r, t, e, n) {
                                          return {
                                            distinct: r,
                                            expr: t,
                                            orderby: e,
                                            separator: n,
                                          };
                                        })(e, n, o, u)),
                                        (t = e))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s))));
                        return t;
                      })()) !== s &&
                      Zf() !== s &&
                      Vf() !== s &&
                      Zf() !== s
                        ? ((o = Pc()) === s && (o = null),
                          o !== s
                            ? (t,
                              (t = e =
                                {
                                  type: 'aggr_func',
                                  name: e,
                                  args: n,
                                  over: o,
                                }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                      return t;
                    })()) === s &&
                      (t = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          (e = (function () {
                            var t;
                            (t = (function () {
                              var t, e, n, o;
                              ((t = _a),
                                'sum' === r.substr(_a, 3).toLowerCase()
                                  ? ((e = r.substr(_a, 3)), (_a += 3))
                                  : ((e = s), 0 === Ra && Ua(Os)));
                              e !== s
                                ? ((n = _a),
                                  Ra++,
                                  (o = jc()),
                                  Ra--,
                                  o === s ? (n = void 0) : ((_a = n), (n = s)),
                                  n !== s
                                    ? (t, (t = e = 'SUM'))
                                    : ((_a = t), (t = s)))
                                : ((_a = t), (t = s));
                              return t;
                            })()) === s &&
                              (t = (function () {
                                var t, e, n, o;
                                ((t = _a),
                                  'max' === r.substr(_a, 3).toLowerCase()
                                    ? ((e = r.substr(_a, 3)), (_a += 3))
                                    : ((e = s), 0 === Ra && Ua(gs)));
                                e !== s
                                  ? ((n = _a),
                                    Ra++,
                                    (o = jc()),
                                    Ra--,
                                    o === s
                                      ? (n = void 0)
                                      : ((_a = n), (n = s)),
                                    n !== s
                                      ? (t, (t = e = 'MAX'))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s));
                                return t;
                              })()) === s &&
                              (t = (function () {
                                var t, e, n, o;
                                ((t = _a),
                                  'min' === r.substr(_a, 3).toLowerCase()
                                    ? ((e = r.substr(_a, 3)), (_a += 3))
                                    : ((e = s), 0 === Ra && Ua(Rs)));
                                e !== s
                                  ? ((n = _a),
                                    Ra++,
                                    (o = jc()),
                                    Ra--,
                                    o === s
                                      ? (n = void 0)
                                      : ((_a = n), (n = s)),
                                    n !== s
                                      ? (t, (t = e = 'MIN'))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s));
                                return t;
                              })()) === s &&
                              (t = (function () {
                                var t, e, n, o;
                                ((t = _a),
                                  'avg' === r.substr(_a, 3).toLowerCase()
                                    ? ((e = r.substr(_a, 3)), (_a += 3))
                                    : ((e = s), 0 === Ra && Ua(xs)));
                                e !== s
                                  ? ((n = _a),
                                    Ra++,
                                    (o = jc()),
                                    Ra--,
                                    o === s
                                      ? (n = void 0)
                                      : ((_a = n), (n = s)),
                                    n !== s
                                      ? (t, (t = e = 'AVG'))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s));
                                return t;
                              })());
                            return t;
                          })()) !== s &&
                          Zf() !== s &&
                          Wf() !== s &&
                          Zf() !== s &&
                          (n = Lc()) !== s &&
                          Zf() !== s &&
                          Vf() !== s &&
                          Zf() !== s
                            ? ((o = Pc()) === s && (o = null),
                              o !== s
                                ? (t,
                                  (t = e =
                                    {
                                      type: 'aggr_func',
                                      name: e,
                                      args: { expr: n },
                                      over: o,
                                    }))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)));
                        return t;
                      })());
                    return t;
                  })()) === s &&
                  (t = Xc()) === s &&
                  (t = (function () {
                    var r, t, e, n, o, u, a, i;
                    return (
                      (r = _a),
                      rf() !== s && Zf() !== s && (t = oc()) !== s && Zf() !== s
                        ? ((e = uc()) === s && (e = null),
                          e !== s &&
                          Zf() !== s &&
                          (n = tf()) !== s &&
                          Zf() !== s
                            ? ((o = rf()) === s && (o = null),
                              o !== s
                                ? (r,
                                  (a = t),
                                  (i = e) && a.push(i),
                                  (r = { type: 'case', expr: null, args: a }))
                                : ((_a = r), (r = s)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)),
                      r === s &&
                        ((r = _a),
                        rf() !== s &&
                        Zf() !== s &&
                        (t = ic()) !== s &&
                        Zf() !== s &&
                        (e = oc()) !== s &&
                        Zf() !== s
                          ? ((n = uc()) === s && (n = null),
                            n !== s &&
                            Zf() !== s &&
                            (o = tf()) !== s &&
                            Zf() !== s
                              ? ((u = rf()) === s && (u = null),
                                u !== s
                                  ? (r,
                                    (r = (function (r, t, e) {
                                      return (
                                        e && t.push(e),
                                        { type: 'case', expr: r, args: t }
                                      );
                                    })(t, e, n)))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s))),
                      r
                    );
                  })()) === s &&
                  (t = nc()) === s &&
                  (t = Tc()) === s &&
                  (t = Mc()) === s &&
                  ((t = _a),
                  Wf() !== s &&
                  (e = Zf()) !== s &&
                  (n = cc()) !== s &&
                  Zf() !== s &&
                  Vf() !== s
                    ? (t, ((o = n).parentheses = !0), (t = o))
                    : ((_a = t), (t = s)),
                  t === s &&
                    (t = vb()) === s &&
                    ((t = _a),
                    Zf() !== s
                      ? (63 === r.charCodeAt(_a)
                          ? ((e = '?'), _a++)
                          : ((e = s), 0 === Ra && Ua(Kt)),
                        e !== s
                          ? (t, (t = { type: 'origin', value: e }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))),
                t
              );
            }
            function Tc() {
              var r, t, e, n, o, u, a, i, c, l, f, b, p;
              if (
                ((r = _a),
                (t = _a),
                (e = _c()) !== s &&
                (n = Zf()) !== s &&
                (o = Hf()) !== s &&
                (u = Zf()) !== s
                  ? (t = e = [e, n, o, u])
                  : ((_a = t), (t = s)),
                t === s && (t = null),
                t !== s)
              )
                if ((e = Rc()) !== s)
                  if ((n = Zf()) !== s) {
                    if (
                      ((o = []),
                      (u = _a),
                      (a = Kf()) === s && (a = Xf()),
                      a !== s && (i = Zf()) !== s
                        ? ((c = zc()) === s && (c = el()),
                          c !== s ? (u = a = [a, i, c]) : ((_a = u), (u = s)))
                        : ((_a = u), (u = s)),
                      u !== s)
                    )
                      for (; u !== s; )
                        (o.push(u),
                          (u = _a),
                          (a = Kf()) === s && (a = Xf()),
                          a !== s && (i = Zf()) !== s
                            ? ((c = zc()) === s && (c = el()),
                              c !== s
                                ? (u = a = [a, i, c])
                                : ((_a = u), (u = s)))
                            : ((_a = u), (u = s)));
                    else o = s;
                    o !== s && (u = Zf()) !== s
                      ? ((a = Ka()) === s && (a = null),
                        a !== s
                          ? (r,
                            (r = t =
                              (function (r, t, e, n) {
                                const o = (r && r[0]) || null;
                                return (
                                  Rb.add(`select::${o}::${t}`),
                                  {
                                    type: 'column_ref',
                                    table: o,
                                    column: t,
                                    collate: n,
                                    arrows: e.map((r) => r[0]),
                                    properties: e.map((r) => r[2]),
                                  }
                                );
                              })(t, e, o, a)))
                          : ((_a = r), (r = s)))
                      : ((_a = r), (r = s));
                  } else ((_a = r), (r = s));
                else ((_a = r), (r = s));
              else ((_a = r), (r = s));
              return (
                r === s &&
                  ((r = _a),
                  (t = xc()) === s && (t = Nc()),
                  t !== s &&
                  (e = Zf()) !== s &&
                  (n = Hf()) !== s &&
                  (o = Zf()) !== s
                    ? ((u = xc()) === s && (u = Nc()),
                      u !== s &&
                      (a = Zf()) !== s &&
                      (i = Hf()) !== s &&
                      (c = Zf()) !== s &&
                      (l = gc()) !== s
                        ? (r,
                          (f = t),
                          (b = u),
                          (p = l),
                          Rb.add(`select::${f}::${b}::${p}`),
                          (r = t =
                            { type: 'column_ref', db: f, table: b, column: p }))
                        : ((_a = r), (r = s)))
                    : ((_a = r), (r = s)),
                  r === s &&
                    ((r = _a),
                    (t = xc()) === s && (t = Nc()),
                    t !== s &&
                    (e = Zf()) !== s &&
                    (n = Hf()) !== s &&
                    (o = Zf()) !== s &&
                    (u = gc()) !== s
                      ? (r,
                        (r = t =
                          (function (r, t) {
                            return (
                              Rb.add(`select::${r}::${t}`),
                              { type: 'column_ref', table: r, column: t }
                            );
                          })(t, u)))
                      : ((_a = r), (r = s)),
                    r === s &&
                      ((r = _a),
                      (t = Rc()) !== s &&
                        (r,
                        (t = (function (r) {
                          return (
                            Rb.add('select::null::' + r),
                            { type: 'column_ref', table: null, column: r }
                          );
                        })(t))),
                      (r = t)))),
                r
              );
            }
            function Ic() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = Rc()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Rc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = Rc()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function _c() {
              var r, t;
              return (
                (r = _a),
                (t = xc()) !== s
                  ? (_a,
                    (me(t) ? s : void 0) !== s
                      ? (r, (r = t = t))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r === s && (r = Sc()),
                r
              );
            }
            function Sc() {
              var t;
              return (
                (t = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    34 === r.charCodeAt(_a)
                      ? ((e = '"'), _a++)
                      : ((e = s), 0 === Ra && Ua(Ee)));
                  if (e !== s) {
                    if (
                      ((n = []),
                      Ae.test(r.charAt(_a))
                        ? ((o = r.charAt(_a)), _a++)
                        : ((o = s), 0 === Ra && Ua(Te)),
                      o !== s)
                    )
                      for (; o !== s; )
                        (n.push(o),
                          Ae.test(r.charAt(_a))
                            ? ((o = r.charAt(_a)), _a++)
                            : ((o = s), 0 === Ra && Ua(Te)));
                    else n = s;
                    n !== s
                      ? (34 === r.charCodeAt(_a)
                          ? ((o = '"'), _a++)
                          : ((o = s), 0 === Ra && Ua(Ee)),
                        o !== s
                          ? (t, (e = Ie(n)), (t = e))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                  } else ((_a = t), (t = s));
                  return t;
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      39 === r.charCodeAt(_a)
                        ? ((e = "'"), _a++)
                        : ((e = s), 0 === Ra && Ua(Ur)));
                    if (e !== s) {
                      if (
                        ((n = []),
                        _e.test(r.charAt(_a))
                          ? ((o = r.charAt(_a)), _a++)
                          : ((o = s), 0 === Ra && Ua(Se)),
                        o !== s)
                      )
                        for (; o !== s; )
                          (n.push(o),
                            _e.test(r.charAt(_a))
                              ? ((o = r.charAt(_a)), _a++)
                              : ((o = s), 0 === Ra && Ua(Se)));
                      else n = s;
                      n !== s
                        ? (39 === r.charCodeAt(_a)
                            ? ((o = "'"), _a++)
                            : ((o = s), 0 === Ra && Ua(Ur)),
                          o !== s
                            ? (t, (e = Ie(n)), (t = e))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                    return t;
                  })()) === s &&
                  (t = Nc()),
                t
              );
            }
            function Nc() {
              var t, e, n, o;
              if (
                ((t = _a),
                96 === r.charCodeAt(_a)
                  ? ((e = '`'), _a++)
                  : ((e = s), 0 === Ra && Ua(Ne)),
                e !== s)
              ) {
                if (
                  ((n = []),
                  ge.test(r.charAt(_a))
                    ? ((o = r.charAt(_a)), _a++)
                    : ((o = s), 0 === Ra && Ua(Re)),
                  o === s && (o = tl()),
                  o !== s)
                )
                  for (; o !== s; )
                    (n.push(o),
                      ge.test(r.charAt(_a))
                        ? ((o = r.charAt(_a)), _a++)
                        : ((o = s), 0 === Ra && Ua(Re)),
                      o === s && (o = tl()));
                else n = s;
                n !== s
                  ? (96 === r.charCodeAt(_a)
                      ? ((o = '`'), _a++)
                      : ((o = s), 0 === Ra && Ua(Ne)),
                    o !== s ? (t, (t = e = Ie(n))) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s));
              } else ((_a = t), (t = s));
              return t;
            }
            function gc() {
              var r, t;
              return (
                (r = _a),
                (t = Oc()) !== s && (r, (t = t)),
                (r = t) === s && (r = Sc()),
                r
              );
            }
            function Rc() {
              var r, t;
              return (
                (r = _a),
                (t = Oc()) !== s
                  ? (_a,
                    (me(t) ? s : void 0) !== s
                      ? (r, (r = t = t))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r === s && (r = Nc()),
                r
              );
            }
            function Oc() {
              var r, t, e, n;
              if (((r = _a), (t = jc()) !== s)) {
                for (e = [], n = Uc(); n !== s; ) (e.push(n), (n = Uc()));
                e !== s ? (r, (r = t = Oe(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function xc() {
              var r, t, e, n;
              if (((r = _a), (t = jc()) !== s)) {
                for (e = [], n = kc(); n !== s; ) (e.push(n), (n = kc()));
                e !== s ? (r, (r = t = Oe(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function jc() {
              var t;
              return (
                xe.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(je)),
                t
              );
            }
            function kc() {
              var t;
              return (
                ke.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(Ue)),
                t
              );
            }
            function Uc() {
              var t;
              return (
                Me.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(De)),
                t
              );
            }
            function Mc() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = _a),
                58 === r.charCodeAt(_a)
                  ? ((n = ':'), _a++)
                  : ((n = s), 0 === Ra && Ua(Pe)),
                n !== s && (o = xc()) !== s
                  ? (e = n = [n, o])
                  : ((_a = e), (e = s)),
                e !== s && (t, (e = { type: 'param', value: e[1] })),
                (t = e)
              );
            }
            function Dc() {
              var t, e, n, o, u, a, i, c, l;
              return (
                (t = _a),
                jl() !== s &&
                Zf() !== s &&
                dl() !== s &&
                Zf() !== s &&
                (e = If()) !== s &&
                Zf() !== s
                  ? ((n = _a),
                    (o = Wf()) !== s && (u = Zf()) !== s
                      ? ((a = ec()) === s && (a = null),
                        a !== s && (i = Zf()) !== s && (c = Vf()) !== s
                          ? (n = o = [o, u, a, i, c])
                          : ((_a = n), (n = s)))
                      : ((_a = n), (n = s)),
                    n === s && (n = null),
                    n !== s
                      ? (t,
                        (t = {
                          type: 'on update',
                          keyword: e,
                          parentheses: !!(l = n),
                          expr: l ? l[2] : null,
                        }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  jl() !== s && Zf() !== s && dl() !== s && Zf() !== s
                    ? ('now' === r.substr(_a, 3).toLowerCase()
                        ? ((e = r.substr(_a, 3)), (_a += 3))
                        : ((e = s), 0 === Ra && Ua(Ge)),
                      e !== s &&
                      Zf() !== s &&
                      (n = Wf()) !== s &&
                      (o = Zf()) !== s &&
                      (u = Vf()) !== s
                        ? (t,
                          (t = (function (r) {
                            return {
                              type: 'on update',
                              keyword: r,
                              parentheses: !0,
                            };
                          })(e)))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s))),
                t
              );
            }
            function Pc() {
              var t, e, n;
              return (
                (t = _a),
                'over' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Fe)),
                e !== s && Zf() !== s && (n = Fc()) !== s
                  ? (t,
                    (t = e = { type: 'window', as_window_specification: n }))
                  : ((_a = t), (t = s)),
                t === s && (t = Dc()),
                t
              );
            }
            function Gc() {
              var r, t, e;
              return (
                (r = _a),
                (t = xc()) !== s &&
                Zf() !== s &&
                Sl() !== s &&
                Zf() !== s &&
                (e = Fc()) !== s
                  ? (r, (r = t = { name: t, as_window_specification: e }))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function Fc() {
              var r, t;
              return (
                (r = xc()) === s &&
                  ((r = _a),
                  Wf() !== s && Zf() !== s
                    ? ((t = (function () {
                        var r, t, e, n;
                        ((r = _a), (t = Yi()) === s && (t = null));
                        t !== s && Zf() !== s
                          ? ((e = Bi()) === s && (e = null),
                            e !== s && Zf() !== s
                              ? ((n = (function () {
                                  var r, t, e, n, o;
                                  ((r = _a),
                                    (t = hf()) !== s && Zf() !== s
                                      ? ((e = $c()) === s && (e = Hc()),
                                        e !== s
                                          ? (r,
                                            (t = 'rows ' + e.value),
                                            (r = t))
                                          : ((_a = r), (r = s)))
                                      : ((_a = r), (r = s)));
                                  r === s &&
                                    ((r = _a),
                                    (t = hf()) !== s &&
                                    Zf() !== s &&
                                    (e = Wl()) !== s &&
                                    Zf() !== s &&
                                    (n = Hc()) !== s &&
                                    Zf() !== s &&
                                    Zl() !== s &&
                                    Zf() !== s &&
                                    (o = $c()) !== s
                                      ? (r,
                                        (u = o),
                                        (t = `rows between ${n.value} and ${u.value}`),
                                        (r = t))
                                      : ((_a = r), (r = s)));
                                  var u;
                                  return r;
                                })()) === s && (n = null),
                                n !== s
                                  ? (r,
                                    (r = t =
                                      {
                                        name: null,
                                        partitionby: t,
                                        orderby: e,
                                        window_frame_clause: n,
                                      }))
                                  : ((_a = r), (r = s)))
                              : ((_a = r), (r = s)))
                          : ((_a = r), (r = s));
                        return r;
                      })()) === s && (t = null),
                      t !== s && Zf() !== s && Vf() !== s
                        ? (r,
                          (r = {
                            window_specification: t || {},
                            parentheses: !0,
                          }))
                        : ((_a = r), (r = s)))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function $c() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = Bc()) !== s && Zf() !== s
                  ? ('following' === r.substr(_a, 9).toLowerCase()
                      ? ((n = r.substr(_a, 9)), (_a += 9))
                      : ((n = s), 0 === Ra && Ua(He)),
                    n !== s
                      ? (t, ((o = e).value += ' FOLLOWING'), (t = e = o))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s && (t = Yc()),
                t
              );
            }
            function Hc() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = Bc()) !== s && Zf() !== s
                  ? ('preceding' === r.substr(_a, 9).toLowerCase()
                      ? ((n = r.substr(_a, 9)), (_a += 9))
                      : ((n = s), 0 === Ra && Ua(Ye)),
                    n !== s
                      ? (t, ((o = e).value += ' PRECEDING'), (t = e = o))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s && (t = Yc()),
                t
              );
            }
            function Yc() {
              var t, e, n;
              return (
                (t = _a),
                'current' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Be)),
                e !== s && Zf() !== s
                  ? ('row' === r.substr(_a, 3).toLowerCase()
                      ? ((n = r.substr(_a, 3)), (_a += 3))
                      : ((n = s), 0 === Ra && Ua(j)),
                    n !== s
                      ? (t,
                        (t = e =
                          {
                            type: 'single_quote_string',
                            value: 'current row',
                          }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Bc() {
              var t, e;
              return (
                (t = _a),
                'unbounded' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(We)),
                e !== s &&
                  (t,
                  (e = {
                    type: 'single_quote_string',
                    value: e.toUpperCase(),
                  })),
                (t = e) === s && (t = el()),
                t
              );
            }
            function Wc() {
              var t, e, n;
              return (
                (t = _a),
                'separator' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(Ve)),
                e === s && (e = null),
                e !== s && Zf() !== s && (n = zc()) !== s
                  ? (t, (t = e = { keyword: e, value: n }))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Vc() {
              var t, e;
              return (
                (t = _a),
                'year_month' === r.substr(_a, 10).toLowerCase()
                  ? ((e = r.substr(_a, 10)), (_a += 10))
                  : ((e = s), 0 === Ra && Ua(qe)),
                e === s &&
                  ('day_hour' === r.substr(_a, 8).toLowerCase()
                    ? ((e = r.substr(_a, 8)), (_a += 8))
                    : ((e = s), 0 === Ra && Ua(Xe)),
                  e === s &&
                    ('day_minute' === r.substr(_a, 10).toLowerCase()
                      ? ((e = r.substr(_a, 10)), (_a += 10))
                      : ((e = s), 0 === Ra && Ua(Ke)),
                    e === s &&
                      ('day_second' === r.substr(_a, 10).toLowerCase()
                        ? ((e = r.substr(_a, 10)), (_a += 10))
                        : ((e = s), 0 === Ra && Ua(Qe)),
                      e === s &&
                        ('day_microsecond' === r.substr(_a, 15).toLowerCase()
                          ? ((e = r.substr(_a, 15)), (_a += 15))
                          : ((e = s), 0 === Ra && Ua(Ze)),
                        e === s &&
                          ('hour_minute' === r.substr(_a, 11).toLowerCase()
                            ? ((e = r.substr(_a, 11)), (_a += 11))
                            : ((e = s), 0 === Ra && Ua(ze)),
                          e === s &&
                            ('hour_second' === r.substr(_a, 11).toLowerCase()
                              ? ((e = r.substr(_a, 11)), (_a += 11))
                              : ((e = s), 0 === Ra && Ua(Je)),
                            e === s &&
                              ('hour_microsecond' ===
                              r.substr(_a, 16).toLowerCase()
                                ? ((e = r.substr(_a, 16)), (_a += 16))
                                : ((e = s), 0 === Ra && Ua(rn)),
                              e === s &&
                                ('minute_second' ===
                                r.substr(_a, 13).toLowerCase()
                                  ? ((e = r.substr(_a, 13)), (_a += 13))
                                  : ((e = s), 0 === Ra && Ua(tn)),
                                e === s &&
                                  ('minute_microsecond' ===
                                  r.substr(_a, 18).toLowerCase()
                                    ? ((e = r.substr(_a, 18)), (_a += 18))
                                    : ((e = s), 0 === Ra && Ua(en)),
                                  e === s &&
                                    ('second_microsecond' ===
                                    r.substr(_a, 18).toLowerCase()
                                      ? ((e = r.substr(_a, 18)), (_a += 18))
                                      : ((e = s), 0 === Ra && Ua(nn)),
                                    e === s &&
                                      ('timezone_hour' ===
                                      r.substr(_a, 13).toLowerCase()
                                        ? ((e = r.substr(_a, 13)), (_a += 13))
                                        : ((e = s), 0 === Ra && Ua(on)),
                                      e === s &&
                                        ('timezone_minute' ===
                                        r.substr(_a, 15).toLowerCase()
                                          ? ((e = r.substr(_a, 15)), (_a += 15))
                                          : ((e = s), 0 === Ra && Ua(sn)),
                                        e === s &&
                                          ('century' ===
                                          r.substr(_a, 7).toLowerCase()
                                            ? ((e = r.substr(_a, 7)), (_a += 7))
                                            : ((e = s), 0 === Ra && Ua(un)),
                                          e === s &&
                                            ('day' ===
                                            r.substr(_a, 3).toLowerCase()
                                              ? ((e = r.substr(_a, 3)),
                                                (_a += 3))
                                              : ((e = s), 0 === Ra && Ua(an)),
                                            e === s &&
                                              ('date' ===
                                              r.substr(_a, 4).toLowerCase()
                                                ? ((e = r.substr(_a, 4)),
                                                  (_a += 4))
                                                : ((e = s), 0 === Ra && Ua(cn)),
                                              e === s &&
                                                ('decade' ===
                                                r.substr(_a, 6).toLowerCase()
                                                  ? ((e = r.substr(_a, 6)),
                                                    (_a += 6))
                                                  : ((e = s),
                                                    0 === Ra && Ua(ln)),
                                                e === s &&
                                                  ('dow' ===
                                                  r.substr(_a, 3).toLowerCase()
                                                    ? ((e = r.substr(_a, 3)),
                                                      (_a += 3))
                                                    : ((e = s),
                                                      0 === Ra && Ua(fn)),
                                                  e === s &&
                                                    ('doy' ===
                                                    r
                                                      .substr(_a, 3)
                                                      .toLowerCase()
                                                      ? ((e = r.substr(_a, 3)),
                                                        (_a += 3))
                                                      : ((e = s),
                                                        0 === Ra && Ua(bn)),
                                                    e === s &&
                                                      ('epoch' ===
                                                      r
                                                        .substr(_a, 5)
                                                        .toLowerCase()
                                                        ? ((e = r.substr(
                                                            _a,
                                                            5
                                                          )),
                                                          (_a += 5))
                                                        : ((e = s),
                                                          0 === Ra && Ua(pn)),
                                                      e === s &&
                                                        ('hour' ===
                                                        r
                                                          .substr(_a, 4)
                                                          .toLowerCase()
                                                          ? ((e = r.substr(
                                                              _a,
                                                              4
                                                            )),
                                                            (_a += 4))
                                                          : ((e = s),
                                                            0 === Ra && Ua(vn)),
                                                        e === s &&
                                                          ('isodow' ===
                                                          r
                                                            .substr(_a, 6)
                                                            .toLowerCase()
                                                            ? ((e = r.substr(
                                                                _a,
                                                                6
                                                              )),
                                                              (_a += 6))
                                                            : ((e = s),
                                                              0 === Ra &&
                                                                Ua(dn)),
                                                          e === s &&
                                                            ('isoweek' ===
                                                            r
                                                              .substr(_a, 7)
                                                              .toLowerCase()
                                                              ? ((e = r.substr(
                                                                  _a,
                                                                  7
                                                                )),
                                                                (_a += 7))
                                                              : ((e = s),
                                                                0 === Ra &&
                                                                  Ua(yn)),
                                                            e === s &&
                                                              ('isoyear' ===
                                                              r
                                                                .substr(_a, 7)
                                                                .toLowerCase()
                                                                ? ((e =
                                                                    r.substr(
                                                                      _a,
                                                                      7
                                                                    )),
                                                                  (_a += 7))
                                                                : ((e = s),
                                                                  0 === Ra &&
                                                                    Ua(wn)),
                                                              e === s &&
                                                                ('microseconds' ===
                                                                r
                                                                  .substr(
                                                                    _a,
                                                                    12
                                                                  )
                                                                  .toLowerCase()
                                                                  ? ((e =
                                                                      r.substr(
                                                                        _a,
                                                                        12
                                                                      )),
                                                                    (_a += 12))
                                                                  : ((e = s),
                                                                    0 === Ra &&
                                                                      Ua(Ln)),
                                                                e === s &&
                                                                  ('millennium' ===
                                                                  r
                                                                    .substr(
                                                                      _a,
                                                                      10
                                                                    )
                                                                    .toLowerCase()
                                                                    ? ((e =
                                                                        r.substr(
                                                                          _a,
                                                                          10
                                                                        )),
                                                                      (_a += 10))
                                                                    : ((e = s),
                                                                      0 ===
                                                                        Ra &&
                                                                        Ua(Cn)),
                                                                  e === s &&
                                                                    ('milliseconds' ===
                                                                    r
                                                                      .substr(
                                                                        _a,
                                                                        12
                                                                      )
                                                                      .toLowerCase()
                                                                      ? ((e =
                                                                          r.substr(
                                                                            _a,
                                                                            12
                                                                          )),
                                                                        (_a += 12))
                                                                      : ((e =
                                                                          s),
                                                                        0 ===
                                                                          Ra &&
                                                                          Ua(
                                                                            hn
                                                                          )),
                                                                    e === s &&
                                                                      ('minute' ===
                                                                      r
                                                                        .substr(
                                                                          _a,
                                                                          6
                                                                        )
                                                                        .toLowerCase()
                                                                        ? ((e =
                                                                            r.substr(
                                                                              _a,
                                                                              6
                                                                            )),
                                                                          (_a += 6))
                                                                        : ((e =
                                                                            s),
                                                                          0 ===
                                                                            Ra &&
                                                                            Ua(
                                                                              mn
                                                                            )),
                                                                      e === s &&
                                                                        ('month' ===
                                                                        r
                                                                          .substr(
                                                                            _a,
                                                                            5
                                                                          )
                                                                          .toLowerCase()
                                                                          ? ((e =
                                                                              r.substr(
                                                                                _a,
                                                                                5
                                                                              )),
                                                                            (_a += 5))
                                                                          : ((e =
                                                                              s),
                                                                            0 ===
                                                                              Ra &&
                                                                              Ua(
                                                                                En
                                                                              )),
                                                                        e ===
                                                                          s &&
                                                                          ('quarter' ===
                                                                          r
                                                                            .substr(
                                                                              _a,
                                                                              7
                                                                            )
                                                                            .toLowerCase()
                                                                            ? ((e =
                                                                                r.substr(
                                                                                  _a,
                                                                                  7
                                                                                )),
                                                                              (_a += 7))
                                                                            : ((e =
                                                                                s),
                                                                              0 ===
                                                                                Ra &&
                                                                                Ua(
                                                                                  An
                                                                                )),
                                                                          e ===
                                                                            s &&
                                                                            ('second' ===
                                                                            r
                                                                              .substr(
                                                                                _a,
                                                                                6
                                                                              )
                                                                              .toLowerCase()
                                                                              ? ((e =
                                                                                  r.substr(
                                                                                    _a,
                                                                                    6
                                                                                  )),
                                                                                (_a += 6))
                                                                              : ((e =
                                                                                  s),
                                                                                0 ===
                                                                                  Ra &&
                                                                                  Ua(
                                                                                    Tn
                                                                                  )),
                                                                            e ===
                                                                              s &&
                                                                              ('time' ===
                                                                              r
                                                                                .substr(
                                                                                  _a,
                                                                                  4
                                                                                )
                                                                                .toLowerCase()
                                                                                ? ((e =
                                                                                    r.substr(
                                                                                      _a,
                                                                                      4
                                                                                    )),
                                                                                  (_a += 4))
                                                                                : ((e =
                                                                                    s),
                                                                                  0 ===
                                                                                    Ra &&
                                                                                    Ua(
                                                                                      In
                                                                                    )),
                                                                              e ===
                                                                                s &&
                                                                                ('timezone' ===
                                                                                r
                                                                                  .substr(
                                                                                    _a,
                                                                                    8
                                                                                  )
                                                                                  .toLowerCase()
                                                                                  ? ((e =
                                                                                      r.substr(
                                                                                        _a,
                                                                                        8
                                                                                      )),
                                                                                    (_a += 8))
                                                                                  : ((e =
                                                                                      s),
                                                                                    0 ===
                                                                                      Ra &&
                                                                                      Ua(
                                                                                        _n
                                                                                      )),
                                                                                e ===
                                                                                  s &&
                                                                                  ('week' ===
                                                                                  r
                                                                                    .substr(
                                                                                      _a,
                                                                                      4
                                                                                    )
                                                                                    .toLowerCase()
                                                                                    ? ((e =
                                                                                        r.substr(
                                                                                          _a,
                                                                                          4
                                                                                        )),
                                                                                      (_a += 4))
                                                                                    : ((e =
                                                                                        s),
                                                                                      0 ===
                                                                                        Ra &&
                                                                                        Ua(
                                                                                          Sn
                                                                                        )),
                                                                                  e ===
                                                                                    s &&
                                                                                    ('year' ===
                                                                                    r
                                                                                      .substr(
                                                                                        _a,
                                                                                        4
                                                                                      )
                                                                                      .toLowerCase()
                                                                                      ? ((e =
                                                                                          r.substr(
                                                                                            _a,
                                                                                            4
                                                                                          )),
                                                                                        (_a += 4))
                                                                                      : ((e =
                                                                                          s),
                                                                                        0 ===
                                                                                          Ra &&
                                                                                          Ua(
                                                                                            Nn
                                                                                          )))))))))))))))))))))))))))))))))))),
                e !== s && (t, (e = e)),
                (t = e)
              );
            }
            function qc() {
              var t, e, n;
              return (
                (t = _a),
                (e = (function () {
                  var t;
                  return (
                    'both' === r.substr(_a, 4).toLowerCase()
                      ? ((t = r.substr(_a, 4)), (_a += 4))
                      : ((t = s), 0 === Ra && Ua(Rn)),
                    t === s &&
                      ('leading' === r.substr(_a, 7).toLowerCase()
                        ? ((t = r.substr(_a, 7)), (_a += 7))
                        : ((t = s), 0 === Ra && Ua(On)),
                      t === s &&
                        ('trailing' === r.substr(_a, 8).toLowerCase()
                          ? ((t = r.substr(_a, 8)), (_a += 8))
                          : ((t = s), 0 === Ra && Ua(xn)))),
                    t
                  );
                })()) === s && (e = null),
                e !== s && Zf() !== s
                  ? ((n = zc()) === s && (n = null),
                    n !== s && Zf() !== s && Il() !== s
                      ? (t,
                        (t = e =
                          (function (r, t, e) {
                            let n = [];
                            return (
                              r && n.push({ type: 'origin', value: r }),
                              t && n.push(t),
                              n.push({ type: 'origin', value: 'from' }),
                              { type: 'expr_list', value: n }
                            );
                          })(e, n)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Xc() {
              var t, e, n, o, u, a, i;
              return (
                (t = (function () {
                  var t, e, n, o, u, a, i, c;
                  return (
                    (t = _a),
                    (e = Jl()) !== s &&
                    Zf() !== s &&
                    Wf() !== s &&
                    Zf() !== s &&
                    (n = Vc()) !== s &&
                    Zf() !== s &&
                    Il() !== s &&
                    Zf() !== s
                      ? ((o = Ef()) === s &&
                          (o = Tf()) === s &&
                          (o = mf()) === s &&
                          (o = Lf()),
                        o !== s &&
                        Zf() !== s &&
                        (u = ic()) !== s &&
                        Zf() !== s &&
                        Vf() !== s
                          ? (t,
                            (a = n),
                            (i = o),
                            (c = u),
                            (t = e =
                              {
                                type: e.toLowerCase(),
                                args: { field: a, cast_type: i, source: c },
                              }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      (e = Jl()) !== s &&
                      Zf() !== s &&
                      Wf() !== s &&
                      Zf() !== s &&
                      (n = Vc()) !== s &&
                      Zf() !== s &&
                      Il() !== s &&
                      Zf() !== s &&
                      (o = ic()) !== s &&
                      Zf() !== s &&
                      (u = Vf()) !== s
                        ? (t,
                          (t = e =
                            (function (r, t, e) {
                              return {
                                type: r.toLowerCase(),
                                args: { field: t, source: e },
                              };
                            })(e, n, o)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        'date_trunc' === r.substr(_a, 10).toLowerCase()
                          ? ((e = r.substr(_a, 10)), (_a += 10))
                          : ((e = s), 0 === Ra && Ua(gn)),
                        e !== s &&
                        Zf() !== s &&
                        Wf() !== s &&
                        Zf() !== s &&
                        (n = ic()) !== s &&
                        Zf() !== s &&
                        Yf() !== s &&
                        Zf() !== s &&
                        (o = Vc()) !== s &&
                        Zf() !== s &&
                        (u = Vf()) !== s
                          ? (t,
                            (t = e =
                              (function (r, t) {
                                return {
                                  type: 'function',
                                  name: 'DATE_TRUNC',
                                  args: {
                                    type: 'expr_list',
                                    value: [r, { type: 'origin', value: t }],
                                  },
                                  over: null,
                                };
                              })(n, o)))
                          : ((_a = t), (t = s)))),
                    t
                  );
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    return (
                      (t = _a),
                      'trim' === r.substr(_a, 4).toLowerCase()
                        ? ((e = r.substr(_a, 4)), (_a += 4))
                        : ((e = s), 0 === Ra && Ua(jn)),
                      e !== s && Zf() !== s && Wf() !== s && Zf() !== s
                        ? ((n = qc()) === s && (n = null),
                          n !== s &&
                          Zf() !== s &&
                          (o = ic()) !== s &&
                          Zf() !== s &&
                          Vf() !== s
                            ? (t,
                              (t = e =
                                (function (r, t) {
                                  let e = r || { type: 'expr_list', value: [] };
                                  return (
                                    e.value.push(t),
                                    { type: 'function', name: 'TRIM', args: e }
                                  );
                                })(n, o)))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t
                    );
                  })()) === s &&
                  ((t = _a),
                  'convert' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(kn)),
                  e !== s &&
                  Zf() !== s &&
                  (n = Wf()) !== s &&
                  Zf() !== s &&
                  (o = (function () {
                    var r, t, e, n, o, u;
                    return (
                      (r = _a),
                      (t = cb()) !== s && Zf() !== s && Yf() !== s && Zf() !== s
                        ? ((e = wb()) === s && (e = Cb()),
                          e !== s &&
                          Zf() !== s &&
                          (n = ai()) !== s &&
                          Zf() !== s &&
                          (o = xc()) !== s
                            ? (r,
                              (r = t =
                                (function (r, t, e, n) {
                                  const { dataType: o, length: s } = t;
                                  let u = o;
                                  return (
                                    void 0 !== s && (u = `${u}(${s})`),
                                    {
                                      type: 'expr_list',
                                      value: [
                                        r,
                                        {
                                          type: 'origin',
                                          value: `${u} ${e} ${n}`,
                                        },
                                      ],
                                    }
                                  );
                                })(t, e, n, o)))
                            : ((_a = r), (r = s)))
                        : ((_a = r), (r = s)),
                      r === s &&
                        ((r = _a),
                        (t = cb()) !== s &&
                        Zf() !== s &&
                        Yf() !== s &&
                        Zf() !== s &&
                        (e = yb()) !== s
                          ? (r,
                            (u = e),
                            (r = t =
                              {
                                type: 'expr_list',
                                value: [t, { type: 'datatype', ...u }],
                              }))
                          : ((_a = r), (r = s)),
                        r === s &&
                          ((r = _a),
                          (t = cc()) !== s &&
                          Zf() !== s &&
                          Dl() !== s &&
                          Zf() !== s &&
                          (e = xc()) !== s
                            ? (r,
                              (r = t =
                                (function (r, t) {
                                  return (
                                    (r.suffix = 'USING ' + t.toUpperCase()),
                                    { type: 'expr_list', value: [r] }
                                  );
                                })(t, e)))
                            : ((_a = r), (r = s)))),
                      r
                    );
                  })()) !== s &&
                  (u = Zf()) !== s &&
                  Vf() !== s &&
                  Zf() !== s
                    ? ((a = Ka()) === s && (a = null),
                      a !== s
                        ? (t,
                          (t = e =
                            {
                              type: 'function',
                              name: 'CONVERT',
                              args: o,
                              collate: a,
                            }))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    (e = (function () {
                      var t;
                      (t = Kc()) === s &&
                        (t = _f()) === s &&
                        (t = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'user' === r.substr(_a, 4).toLowerCase()
                              ? ((e = r.substr(_a, 4)), (_a += 4))
                              : ((e = s), 0 === Ra && Ua(vu)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'USER'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })()) === s &&
                        (t = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'session_user' === r.substr(_a, 12).toLowerCase()
                              ? ((e = r.substr(_a, 12)), (_a += 12))
                              : ((e = s), 0 === Ra && Ua(mu)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'SESSION_USER'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })()) === s &&
                        (t = (function () {
                          var t, e, n, o;
                          ((t = _a),
                            'system_user' === r.substr(_a, 11).toLowerCase()
                              ? ((e = r.substr(_a, 11)), (_a += 11))
                              : ((e = s), 0 === Ra && Ua(Eu)));
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'SYSTEM_USER'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s));
                          return t;
                        })());
                      return t;
                    })()) !== s &&
                    Zf() !== s &&
                    (n = Wf()) !== s &&
                    Zf() !== s
                      ? ((o = ec()) === s && (o = null),
                        o !== s && (u = Zf()) !== s && Vf() !== s && Zf() !== s
                          ? ((a = Pc()) === s && (a = null),
                            a !== s
                              ? (t,
                                (t = e =
                                  (function (r, t, e) {
                                    return {
                                      type: 'function',
                                      name: r,
                                      args: t || {
                                        type: 'expr_list',
                                        value: [],
                                      },
                                      over: e,
                                    };
                                  })(e, o, a)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)),
                    t === s &&
                      ((t = _a),
                      (e = Kc()) !== s && Zf() !== s
                        ? ((n = Dc()) === s && (n = null),
                          n !== s
                            ? (t,
                              (t = e = { type: 'function', name: e, over: n }))
                            : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t === s &&
                        ((t = _a),
                        (e = lb()) !== s
                          ? (_a,
                            ('convert' !== e.toLowerCase() ? void 0 : s) !==
                              s &&
                            (n = Zf()) !== s &&
                            Wf() !== s &&
                            (o = Zf()) !== s
                              ? ((u = cc()) === s && (u = null),
                                u !== s &&
                                Zf() !== s &&
                                Vf() !== s &&
                                (a = Zf()) !== s
                                  ? ((i = Pc()) === s && (i = null),
                                    i !== s
                                      ? (t,
                                        (t = e =
                                          (function (r, t, e) {
                                            return (
                                              t &&
                                                'expr_list' !== t.type &&
                                                (t = {
                                                  type: 'expr_list',
                                                  value: [t],
                                                }),
                                              ('TIMESTAMPDIFF' ===
                                                r.toUpperCase() ||
                                                'TIMESTAMPADD' ===
                                                  r.toUpperCase()) &&
                                                t.value &&
                                                t.value[0] &&
                                                (t.value[0] = {
                                                  type: 'origin',
                                                  value: t.value[0].column,
                                                }),
                                              {
                                                type: 'function',
                                                name: r,
                                                args: t || {
                                                  type: 'expr_list',
                                                  value: [],
                                                },
                                                over: e,
                                              }
                                            );
                                          })(e, u, i)))
                                      : ((_a = t), (t = s)))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)))))),
                t
              );
            }
            function Kc() {
              var t;
              return (
                (t = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'current_date' === r.substr(_a, 12).toLowerCase()
                      ? ((e = r.substr(_a, 12)), (_a += 12))
                      : ((e = s), 0 === Ra && Ua(du)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s
                        ? (t, (t = e = 'CURRENT_DATE'))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      'current_time' === r.substr(_a, 12).toLowerCase()
                        ? ((e = r.substr(_a, 12)), (_a += 12))
                        : ((e = s), 0 === Ra && Ua(Lu)));
                    e !== s
                      ? ((n = _a),
                        Ra++,
                        (o = jc()),
                        Ra--,
                        o === s ? (n = void 0) : ((_a = n), (n = s)),
                        n !== s
                          ? (t, (t = e = 'CURRENT_TIME'))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                    return t;
                  })()) === s &&
                  (t = If()),
                t
              );
            }
            function Qc() {
              var t, e, n, o, u, a, i, c, l;
              return (
                (t = _a),
                'binary' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Un)),
                e === s &&
                  ('_binary' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(Mn))),
                e === s && (e = null),
                e !== s && Zf() !== s && (n = zc()) !== s
                  ? ((o = _a),
                    (u = Zf()) !== s && (a = Ka()) !== s
                      ? (o = u = [u, a])
                      : ((_a = o), (o = s)),
                    o === s && (o = null),
                    o !== s
                      ? (t,
                        (c = n),
                        (l = o),
                        (i = e) && (c.prefix = i.toLowerCase()),
                        l && (c.suffix = { collate: l[1] }),
                        (t = e = c))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  (t = el()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'true' === r.substr(_a, 4).toLowerCase()
                            ? ((e = r.substr(_a, 4)), (_a += 4))
                            : ((e = s), 0 === Ra && Ua(mo)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s && (t, (e = { type: 'bool', value: !0 })));
                    (t = e) === s &&
                      ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        ((t = _a),
                          'false' === r.substr(_a, 5).toLowerCase()
                            ? ((e = r.substr(_a, 5)), (_a += 5))
                            : ((e = s), 0 === Ra && Ua(Ao)));
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                        return t;
                      })()) !== s && (t, (e = { type: 'bool', value: !1 })),
                      (t = e));
                    return t;
                  })()) === s &&
                  (t = Zc()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a;
                    ((t = _a),
                      (e = mf()) === s &&
                        (e = Lf()) === s &&
                        (e = Ef()) === s &&
                        (e = Cf()));
                    if (e !== s)
                      if (Zf() !== s) {
                        if (
                          ((n = _a),
                          39 === r.charCodeAt(_a)
                            ? ((o = "'"), _a++)
                            : ((o = s), 0 === Ra && Ua(Ur)),
                          o !== s)
                        ) {
                          for (u = [], a = rl(); a !== s; )
                            (u.push(a), (a = rl()));
                          u !== s
                            ? (39 === r.charCodeAt(_a)
                                ? ((a = "'"), _a++)
                                : ((a = s), 0 === Ra && Ua(Ur)),
                              a !== s
                                ? (n = o = [o, u, a])
                                : ((_a = n), (n = s)))
                            : ((_a = n), (n = s));
                        } else ((_a = n), (n = s));
                        n !== s
                          ? (t, (e = Bn(e, n)), (t = e))
                          : ((_a = t), (t = s));
                      } else ((_a = t), (t = s));
                    else ((_a = t), (t = s));
                    if (t === s)
                      if (
                        ((t = _a),
                        (e = mf()) === s &&
                          (e = Lf()) === s &&
                          (e = Ef()) === s &&
                          (e = Cf()),
                        e !== s)
                      )
                        if (Zf() !== s) {
                          if (
                            ((n = _a),
                            34 === r.charCodeAt(_a)
                              ? ((o = '"'), _a++)
                              : ((o = s), 0 === Ra && Ua(Ee)),
                            o !== s)
                          ) {
                            for (u = [], a = Jc(); a !== s; )
                              (u.push(a), (a = Jc()));
                            u !== s
                              ? (34 === r.charCodeAt(_a)
                                  ? ((a = '"'), _a++)
                                  : ((a = s), 0 === Ra && Ua(Ee)),
                                a !== s
                                  ? (n = o = [o, u, a])
                                  : ((_a = n), (n = s)))
                              : ((_a = n), (n = s));
                          } else ((_a = n), (n = s));
                          n !== s
                            ? (t, (e = Bn(e, n)), (t = e))
                            : ((_a = t), (t = s));
                        } else ((_a = t), (t = s));
                      else ((_a = t), (t = s));
                    return t;
                  })()),
                t
              );
            }
            function Zc() {
              var t, e;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n, o;
                  ((t = _a),
                    'null' === r.substr(_a, 4).toLowerCase()
                      ? ((e = r.substr(_a, 4)), (_a += 4))
                      : ((e = s), 0 === Ra && Ua(Co)));
                  e !== s
                    ? ((n = _a),
                      Ra++,
                      (o = jc()),
                      Ra--,
                      o === s ? (n = void 0) : ((_a = n), (n = s)),
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  return t;
                })()) !== s && (t, (e = { type: 'null', value: null })),
                (t = e)
              );
            }
            function zc() {
              var t, e, n, o, u, a, i, c;
              if (
                ((t = _a),
                '_binary' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Mn)),
                e === s &&
                  ('_latin1' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(Dn))),
                e === s && (e = null),
                e !== s)
              )
                if ((n = Zf()) !== s)
                  if (
                    ('x' === r.substr(_a, 1).toLowerCase()
                      ? ((o = r.charAt(_a)), _a++)
                      : ((o = s), 0 === Ra && Ua(Pn)),
                    o !== s)
                  ) {
                    if (
                      ((u = _a),
                      39 === r.charCodeAt(_a)
                        ? ((a = "'"), _a++)
                        : ((a = s), 0 === Ra && Ua(Ur)),
                      a !== s)
                    ) {
                      for (
                        i = [],
                          Gn.test(r.charAt(_a))
                            ? ((c = r.charAt(_a)), _a++)
                            : ((c = s), 0 === Ra && Ua(Fn));
                        c !== s;

                      )
                        (i.push(c),
                          Gn.test(r.charAt(_a))
                            ? ((c = r.charAt(_a)), _a++)
                            : ((c = s), 0 === Ra && Ua(Fn)));
                      i !== s
                        ? (39 === r.charCodeAt(_a)
                            ? ((c = "'"), _a++)
                            : ((c = s), 0 === Ra && Ua(Ur)),
                          c !== s ? (u = a = [a, i, c]) : ((_a = u), (u = s)))
                        : ((_a = u), (u = s));
                    } else ((_a = u), (u = s));
                    u !== s
                      ? (t,
                        (t = e =
                          {
                            type: 'hex_string',
                            prefix: e,
                            value: u[1].join(''),
                          }))
                      : ((_a = t), (t = s));
                  } else ((_a = t), (t = s));
                else ((_a = t), (t = s));
              else ((_a = t), (t = s));
              if (t === s) {
                if (
                  ((t = _a),
                  '_binary' === r.substr(_a, 7).toLowerCase()
                    ? ((e = r.substr(_a, 7)), (_a += 7))
                    : ((e = s), 0 === Ra && Ua(Mn)),
                  e === s &&
                    ('_latin1' === r.substr(_a, 7).toLowerCase()
                      ? ((e = r.substr(_a, 7)), (_a += 7))
                      : ((e = s), 0 === Ra && Ua(Dn))),
                  e === s && (e = null),
                  e !== s)
                )
                  if ((n = Zf()) !== s)
                    if (
                      ('b' === r.substr(_a, 1).toLowerCase()
                        ? ((o = r.charAt(_a)), _a++)
                        : ((o = s), 0 === Ra && Ua($n)),
                      o !== s)
                    ) {
                      if (
                        ((u = _a),
                        39 === r.charCodeAt(_a)
                          ? ((a = "'"), _a++)
                          : ((a = s), 0 === Ra && Ua(Ur)),
                        a !== s)
                      ) {
                        for (
                          i = [],
                            Gn.test(r.charAt(_a))
                              ? ((c = r.charAt(_a)), _a++)
                              : ((c = s), 0 === Ra && Ua(Fn));
                          c !== s;

                        )
                          (i.push(c),
                            Gn.test(r.charAt(_a))
                              ? ((c = r.charAt(_a)), _a++)
                              : ((c = s), 0 === Ra && Ua(Fn)));
                        i !== s
                          ? (39 === r.charCodeAt(_a)
                              ? ((c = "'"), _a++)
                              : ((c = s), 0 === Ra && Ua(Ur)),
                            c !== s ? (u = a = [a, i, c]) : ((_a = u), (u = s)))
                          : ((_a = u), (u = s));
                      } else ((_a = u), (u = s));
                      u !== s
                        ? (t,
                          (t = e =
                            (function (r, t, e) {
                              return {
                                type: 'bit_string',
                                prefix: r,
                                value: e[1].join(''),
                              };
                            })(e, 0, u)))
                        : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                  else ((_a = t), (t = s));
                else ((_a = t), (t = s));
                if (t === s) {
                  if (
                    ((t = _a),
                    '_binary' === r.substr(_a, 7).toLowerCase()
                      ? ((e = r.substr(_a, 7)), (_a += 7))
                      : ((e = s), 0 === Ra && Ua(Mn)),
                    e === s &&
                      ('_latin1' === r.substr(_a, 7).toLowerCase()
                        ? ((e = r.substr(_a, 7)), (_a += 7))
                        : ((e = s), 0 === Ra && Ua(Dn))),
                    e === s && (e = null),
                    e !== s)
                  )
                    if ((n = Zf()) !== s)
                      if (
                        ('0x' === r.substr(_a, 2).toLowerCase()
                          ? ((o = r.substr(_a, 2)), (_a += 2))
                          : ((o = s), 0 === Ra && Ua(Hn)),
                        o !== s)
                      ) {
                        for (
                          u = [],
                            Gn.test(r.charAt(_a))
                              ? ((a = r.charAt(_a)), _a++)
                              : ((a = s), 0 === Ra && Ua(Fn));
                          a !== s;

                        )
                          (u.push(a),
                            Gn.test(r.charAt(_a))
                              ? ((a = r.charAt(_a)), _a++)
                              : ((a = s), 0 === Ra && Ua(Fn)));
                        u !== s
                          ? (t,
                            (t = e =
                              (function (r, t, e) {
                                return {
                                  type: 'full_hex_string',
                                  prefix: r,
                                  value: e.join(''),
                                };
                              })(e, 0, u)))
                          : ((_a = t), (t = s));
                      } else ((_a = t), (t = s));
                    else ((_a = t), (t = s));
                  else ((_a = t), (t = s));
                  if (t === s) {
                    if (
                      ((t = _a),
                      'n' === r.substr(_a, 1).toLowerCase()
                        ? ((e = r.charAt(_a)), _a++)
                        : ((e = s), 0 === Ra && Ua(Yn)),
                      e !== s)
                    ) {
                      if (
                        ((n = _a),
                        39 === r.charCodeAt(_a)
                          ? ((o = "'"), _a++)
                          : ((o = s), 0 === Ra && Ua(Ur)),
                        o !== s)
                      ) {
                        for (u = [], a = rl(); a !== s; )
                          (u.push(a), (a = rl()));
                        u !== s
                          ? (39 === r.charCodeAt(_a)
                              ? ((a = "'"), _a++)
                              : ((a = s), 0 === Ra && Ua(Ur)),
                            a !== s ? (n = o = [o, u, a]) : ((_a = n), (n = s)))
                          : ((_a = n), (n = s));
                      } else ((_a = n), (n = s));
                      n !== s
                        ? (t,
                          (t = e =
                            (function (r, t) {
                              return {
                                type: 'natural_string',
                                value: t[1].join(''),
                              };
                            })(0, n)))
                        : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                    if (t === s) {
                      if (
                        ((t = _a),
                        (e = _a),
                        39 === r.charCodeAt(_a)
                          ? ((n = "'"), _a++)
                          : ((n = s), 0 === Ra && Ua(Ur)),
                        n !== s)
                      ) {
                        for (o = [], u = rl(); u !== s; )
                          (o.push(u), (u = rl()));
                        o !== s
                          ? (39 === r.charCodeAt(_a)
                              ? ((u = "'"), _a++)
                              : ((u = s), 0 === Ra && Ua(Ur)),
                            u !== s ? (e = n = [n, o, u]) : ((_a = e), (e = s)))
                          : ((_a = e), (e = s));
                      } else ((_a = e), (e = s));
                      if (
                        (e !== s &&
                          (t,
                          (e = (function (r) {
                            return {
                              type: 'single_quote_string',
                              value: r[1].join(''),
                            };
                          })(e))),
                        (t = e) === s)
                      ) {
                        if (
                          ((t = _a),
                          (e = _a),
                          34 === r.charCodeAt(_a)
                            ? ((n = '"'), _a++)
                            : ((n = s), 0 === Ra && Ua(Ee)),
                          n !== s)
                        ) {
                          for (o = [], u = Jc(); u !== s; )
                            (o.push(u), (u = Jc()));
                          o !== s
                            ? (34 === r.charCodeAt(_a)
                                ? ((u = '"'), _a++)
                                : ((u = s), 0 === Ra && Ua(Ee)),
                              u !== s
                                ? (e = n = [n, o, u])
                                : ((_a = e), (e = s)))
                            : ((_a = e), (e = s));
                        } else ((_a = e), (e = s));
                        (e !== s &&
                          (t,
                          (e = (function (r) {
                            return {
                              type: 'double_quote_string',
                              value: r[1].join(''),
                            };
                          })(e))),
                          (t = e));
                      }
                    }
                  }
                }
              }
              return t;
            }
            function Jc() {
              var t;
              return (
                Wn.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(Vn)),
                t === s && (t = tl()),
                t
              );
            }
            function rl() {
              var t;
              return (
                qn.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(Xn)),
                t === s && (t = tl()),
                t
              );
            }
            function tl() {
              var t, e, n, o, u, a, i, c, l, f;
              return (
                (t = _a),
                "\\'" === r.substr(_a, 2)
                  ? ((e = "\\'"), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(Kn)),
                e !== s && (t, (e = "\\'")),
                (t = e) === s &&
                  ((t = _a),
                  '\\"' === r.substr(_a, 2)
                    ? ((e = '\\"'), (_a += 2))
                    : ((e = s), 0 === Ra && Ua(Qn)),
                  e !== s && (t, (e = '\\"')),
                  (t = e) === s &&
                    ((t = _a),
                    '\\\\' === r.substr(_a, 2)
                      ? ((e = '\\\\'), (_a += 2))
                      : ((e = s), 0 === Ra && Ua(Zn)),
                    e !== s && (t, (e = '\\\\')),
                    (t = e) === s &&
                      ((t = _a),
                      '\\/' === r.substr(_a, 2)
                        ? ((e = '\\/'), (_a += 2))
                        : ((e = s), 0 === Ra && Ua(zn)),
                      e !== s && (t, (e = '\\/')),
                      (t = e) === s &&
                        ((t = _a),
                        '\\b' === r.substr(_a, 2)
                          ? ((e = '\\b'), (_a += 2))
                          : ((e = s), 0 === Ra && Ua(Jn)),
                        e !== s && (t, (e = '\b')),
                        (t = e) === s &&
                          ((t = _a),
                          '\\f' === r.substr(_a, 2)
                            ? ((e = '\\f'), (_a += 2))
                            : ((e = s), 0 === Ra && Ua(ro)),
                          e !== s && (t, (e = '\f')),
                          (t = e) === s &&
                            ((t = _a),
                            '\\n' === r.substr(_a, 2)
                              ? ((e = '\\n'), (_a += 2))
                              : ((e = s), 0 === Ra && Ua(to)),
                            e !== s && (t, (e = '\n')),
                            (t = e) === s &&
                              ((t = _a),
                              '\\r' === r.substr(_a, 2)
                                ? ((e = '\\r'), (_a += 2))
                                : ((e = s), 0 === Ra && Ua(eo)),
                              e !== s && (t, (e = '\r')),
                              (t = e) === s &&
                                ((t = _a),
                                '\\t' === r.substr(_a, 2)
                                  ? ((e = '\\t'), (_a += 2))
                                  : ((e = s), 0 === Ra && Ua(no)),
                                e !== s && (t, (e = '\t')),
                                (t = e) === s &&
                                  ((t = _a),
                                  '\\u' === r.substr(_a, 2)
                                    ? ((e = '\\u'), (_a += 2))
                                    : ((e = s), 0 === Ra && Ua(oo)),
                                  e !== s &&
                                  (n = il()) !== s &&
                                  (o = il()) !== s &&
                                  (u = il()) !== s &&
                                  (a = il()) !== s
                                    ? (t,
                                      (i = n),
                                      (c = o),
                                      (l = u),
                                      (f = a),
                                      (t = e =
                                        String.fromCharCode(
                                          parseInt('0x' + i + c + l + f)
                                        )))
                                    : ((_a = t), (t = s)),
                                  t === s &&
                                    ((t = _a),
                                    92 === r.charCodeAt(_a)
                                      ? ((e = '\\'), _a++)
                                      : ((e = s), 0 === Ra && Ua(so)),
                                    e !== s && (t, (e = '\\')),
                                    (t = e) === s &&
                                      ((t = _a),
                                      "''" === r.substr(_a, 2)
                                        ? ((e = "''"), (_a += 2))
                                        : ((e = s), 0 === Ra && Ua(uo)),
                                      e !== s && (t, (e = "''")),
                                      (t = e) === s &&
                                        ((t = _a),
                                        '""' === r.substr(_a, 2)
                                          ? ((e = '""'), (_a += 2))
                                          : ((e = s), 0 === Ra && Ua(ao)),
                                        e !== s && (t, (e = '""')),
                                        (t = e) === s &&
                                          ((t = _a),
                                          '``' === r.substr(_a, 2)
                                            ? ((e = '``'), (_a += 2))
                                            : ((e = s), 0 === Ra && Ua(io)),
                                          e !== s && (t, (e = '``')),
                                          (t = e)))))))))))))),
                t
              );
            }
            function el() {
              var r, t, e;
              return (
                (r = _a),
                (t = (function () {
                  var r, t, e, n;
                  ((r = _a),
                    (t = nl()) !== s && (e = ol()) !== s && (n = sl()) !== s
                      ? (r, (r = t = { type: 'bigint', value: t + e + n }))
                      : ((_a = r), (r = s)));
                  r === s &&
                    ((r = _a),
                    (t = nl()) !== s && (e = ol()) !== s
                      ? (r,
                        (t = (function (r, t) {
                          const e = r + t;
                          return Ab(r)
                            ? { type: 'bigint', value: e }
                            : parseFloat(e);
                        })(t, e)),
                        (r = t))
                      : ((_a = r), (r = s)),
                    r === s &&
                      ((r = _a),
                      (t = nl()) !== s && (e = sl()) !== s
                        ? (r,
                          (t = (function (r, t) {
                            return { type: 'bigint', value: r + t };
                          })(t, e)),
                          (r = t))
                        : ((_a = r), (r = s)),
                      r === s &&
                        ((r = _a),
                        (t = nl()) !== s &&
                          (r,
                          (t = (function (r) {
                            return Ab(r)
                              ? { type: 'bigint', value: r }
                              : parseFloat(r);
                          })(t))),
                        (r = t))));
                  return r;
                })()) !== s &&
                  (r,
                  (t =
                    (e = t) && 'bigint' === e.type
                      ? e
                      : { type: 'number', value: e })),
                (r = t)
              );
            }
            function nl() {
              var t, e, n;
              return (
                (t = ul()) === s &&
                  (t = al()) === s &&
                  ((t = _a),
                  45 === r.charCodeAt(_a)
                    ? ((e = '-'), _a++)
                    : ((e = s), 0 === Ra && Ua(ie)),
                  e === s &&
                    (43 === r.charCodeAt(_a)
                      ? ((e = '+'), _a++)
                      : ((e = s), 0 === Ra && Ua(ae))),
                  e !== s && (n = ul()) !== s
                    ? (t, (t = e = e + n))
                    : ((_a = t), (t = s)),
                  t === s &&
                    ((t = _a),
                    45 === r.charCodeAt(_a)
                      ? ((e = '-'), _a++)
                      : ((e = s), 0 === Ra && Ua(ie)),
                    e === s &&
                      (43 === r.charCodeAt(_a)
                        ? ((e = '+'), _a++)
                        : ((e = s), 0 === Ra && Ua(ae))),
                    e !== s && (n = al()) !== s
                      ? (t,
                        (t = e =
                          (function (r, t) {
                            return r + t;
                          })(e, n)))
                      : ((_a = t), (t = s)))),
                t
              );
            }
            function ol() {
              var t, e, n, o;
              return (
                (t = _a),
                46 === r.charCodeAt(_a)
                  ? ((e = '.'), _a++)
                  : ((e = s), 0 === Ra && Ua(fo)),
                e !== s
                  ? ((n = ul()) === s && (n = null),
                    n !== s
                      ? (t, (t = e = (o = n) ? '.' + o : ''))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function sl() {
              var t, e, n;
              return (
                (t = _a),
                (e = (function () {
                  var t, e, n;
                  ((t = _a),
                    vo.test(r.charAt(_a))
                      ? ((e = r.charAt(_a)), _a++)
                      : ((e = s), 0 === Ra && Ua(yo)));
                  e !== s
                    ? (wo.test(r.charAt(_a))
                        ? ((n = r.charAt(_a)), _a++)
                        : ((n = s), 0 === Ra && Ua(Lo)),
                      n === s && (n = null),
                      n !== s
                        ? (t, (t = e = e + (null !== (o = n) ? o : '')))
                        : ((_a = t), (t = s)))
                    : ((_a = t), (t = s));
                  var o;
                  return t;
                })()) !== s && (n = ul()) !== s
                  ? (t, (t = e = e + n))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ul() {
              var r, t, e;
              if (((r = _a), (t = []), (e = al()) !== s))
                for (; e !== s; ) (t.push(e), (e = al()));
              else t = s;
              return (t !== s && (r, (t = t.join(''))), (r = t));
            }
            function al() {
              var t;
              return (
                Et.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(At)),
                t
              );
            }
            function il() {
              var t;
              return (
                bo.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(po)),
                t
              );
            }
            function cl() {
              var t, e, n, o;
              return (
                (t = _a),
                'default' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(F)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ll() {
              var t, e, n, o;
              return (
                (t = _a),
                'to' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(Eo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function fl() {
              var t, e, n, o;
              return (
                (t = _a),
                'show' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(To)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function bl() {
              var t, e, n, o;
              return (
                (t = _a),
                'drop' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Io)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DROP')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function pl() {
              var t, e, n, o;
              return (
                (t = _a),
                'alter' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(So)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function vl() {
              var t, e, n, o;
              return (
                (t = _a),
                'select' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(No)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function dl() {
              var t, e, n, o;
              return (
                (t = _a),
                'update' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(go)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function yl() {
              var t, e, n, o;
              return (
                (t = _a),
                'create' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Ro)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function wl() {
              var t, e, n, o;
              return (
                (t = _a),
                'temporary' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(Oo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ll() {
              var t, e, n, o;
              return (
                (t = _a),
                'delete' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(xo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Cl() {
              var t, e, n, o;
              return (
                (t = _a),
                'insert' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(jo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function hl() {
              var t, e, n, o;
              return (
                (t = _a),
                'replace' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Uo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ml() {
              var t, e, n, o;
              return (
                (t = _a),
                'rename' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Mo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function El() {
              var t, e, n, o;
              return (
                (t = _a),
                'ignore' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Do)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Al() {
              var t, e, n, o;
              return (
                (t = _a),
                'partition' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(Po)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'PARTITION')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Tl() {
              var t, e, n, o;
              return (
                (t = _a),
                'into' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Go)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Il() {
              var t, e, n, o;
              return (
                (t = _a),
                'from' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Fo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function _l() {
              var t, e, n, o;
              return (
                (t = _a),
                'set' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(mr)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'SET')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Sl() {
              var t, e, n, o;
              return (
                (t = _a),
                'as' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(V)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Nl() {
              var t, e, n, o;
              return (
                (t = _a),
                'table' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(Ho)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TABLE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function gl() {
              var t, e, n, o;
              return (
                (t = _a),
                'trigger' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Yo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TRIGGER')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Rl() {
              var t, e, n, o;
              return (
                (t = _a),
                'tables' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Bo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TABLES')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ol() {
              var t, e, n, o;
              return (
                (t = _a),
                'database' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(Wo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DATABASE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function xl() {
              var t, e, n, o;
              return (
                (t = _a),
                'schema' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Vo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'SCHEMA')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function jl() {
              var t, e, n, o;
              return (
                (t = _a),
                'on' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(qo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function kl() {
              var t, e, n, o;
              return (
                (t = _a),
                'join' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Jo)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ul() {
              var t, e, n, o;
              return (
                (t = _a),
                'outer' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(rs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ml() {
              var t, e, n, o;
              return (
                (t = _a),
                'values' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(os)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Dl() {
              var t, e, n, o;
              return (
                (t = _a),
                'using' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(ss)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Pl() {
              var t, e, n, o;
              return (
                (t = _a),
                'with' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(jt)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Gl() {
              var t, e, n, o;
              return (
                (t = _a),
                'go' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(as)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'GO')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Fl() {
              var t, e, n, o;
              return (
                (t = _a),
                'by' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(cs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function $l() {
              var t, e, n, o;
              return (
                (t = _a),
                'asc' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(vs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'ASC')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Hl() {
              var t, e, n, o;
              return (
                (t = _a),
                'desc' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(ds)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DESC')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Yl() {
              var t, e, n, o;
              return (
                (t = _a),
                'all' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(ws)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'ALL')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Bl() {
              var t, e, n, o;
              return (
                (t = _a),
                'distinct' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(Ls)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DISTINCT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Wl() {
              var t, e, n, o;
              return (
                (t = _a),
                'between' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Cs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'BETWEEN')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Vl() {
              var t, e, n, o;
              return (
                (t = _a),
                'in' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(Tt)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'IN')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ql() {
              var t, e, n, o;
              return (
                (t = _a),
                'is' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(hs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'IS')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Xl() {
              var t, e, n, o;
              return (
                (t = _a),
                'like' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(ms)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'LIKE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Kl() {
              var t, e, n, o;
              return (
                (t = _a),
                'exists' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Ts)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'EXISTS')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ql() {
              var t, e, n, o;
              return (
                (t = _a),
                'not' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(ir)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'NOT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Zl() {
              var t, e, n, o;
              return (
                (t = _a),
                'and' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(Is)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'AND')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function zl() {
              var t, e, n, o;
              return (
                (t = _a),
                'or' === r.substr(_a, 2).toLowerCase()
                  ? ((e = r.substr(_a, 2)), (_a += 2))
                  : ((e = s), 0 === Ra && Ua(_s)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'OR')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Jl() {
              var t, e, n, o;
              return (
                (t = _a),
                'extract' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(js)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'EXTRACT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function rf() {
              var t, e, n, o;
              return (
                (t = _a),
                'case' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Us)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function tf() {
              var t, e, n, o;
              return (
                (t = _a),
                'end' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(Gs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t = e = [e, n]) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ef() {
              var t, e, n, o;
              return (
                (t = _a),
                'cast' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Fs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'CAST')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function nf() {
              var t, e, n, o;
              return (
                (t = _a),
                'binary' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(Xr)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'BINARY')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function of() {
              var t, e, n, o;
              return (
                (t = _a),
                'char' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Ys)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'CHAR')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function sf() {
              var t, e, n, o;
              return (
                (t = _a),
                'varchar' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Bs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'VARCHAR')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function uf() {
              var t, e, n, o;
              return (
                (t = _a),
                'numeric' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Ws)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'NUMERIC')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function af() {
              var t, e, n, o;
              return (
                (t = _a),
                'decimal' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Vs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DECIMAL')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function cf() {
              var t, e, n, o;
              return (
                (t = _a),
                'unsigned' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(Xs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'UNSIGNED')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function lf() {
              var t, e, n, o;
              return (
                (t = _a),
                'int' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(Ks)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'INT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function ff() {
              var t, e, n, o;
              return (
                (t = _a),
                'integer' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Zs)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'INTEGER')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function bf() {
              var t, e, n, o;
              return (
                (t = _a),
                'smallint' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(Js)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'SMALLINT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function pf() {
              var t, e, n, o;
              return (
                (t = _a),
                'mediumint' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(ru)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'MEDIUMINT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function vf() {
              var t, e, n, o;
              return (
                (t = _a),
                'tinyint' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(tu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TINYINT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function df() {
              var t, e, n, o;
              return (
                (t = _a),
                'bigint' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(uu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'BIGINT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function yf() {
              var t, e, n, o;
              return (
                (t = _a),
                'float' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(iu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'FLOAT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function wf() {
              var t, e, n, o;
              return (
                (t = _a),
                'double' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(cu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DOUBLE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Lf() {
              var t, e, n, o;
              return (
                (t = _a),
                'date' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(cn)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DATE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Cf() {
              var t, e, n, o;
              return (
                (t = _a),
                'datetime' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(lu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'DATETIME')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function hf() {
              var t, e, n, o;
              return (
                (t = _a),
                'rows' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(fu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'ROWS')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function mf() {
              var t, e, n, o;
              return (
                (t = _a),
                'time' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(In)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TIME')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ef() {
              var t, e, n, o;
              return (
                (t = _a),
                'timestamp' === r.substr(_a, 9).toLowerCase()
                  ? ((e = r.substr(_a, 9)), (_a += 9))
                  : ((e = s), 0 === Ra && Ua(bu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'TIMESTAMP')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Af() {
              var t, e, n, o;
              return (
                (t = _a),
                'year' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(Nn)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'YEAR')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Tf() {
              var t, e, n, o;
              return (
                (t = _a),
                'interval' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(yu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'INTERVAL')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function If() {
              var t, e, n, o;
              return (
                (t = _a),
                'current_timestamp' === r.substr(_a, 17).toLowerCase()
                  ? ((e = r.substr(_a, 17)), (_a += 17))
                  : ((e = s), 0 === Ra && Ua(Cu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s
                      ? (t, (t = e = 'CURRENT_TIMESTAMP'))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function _f() {
              var t, e, n, o;
              return (
                (t = _a),
                'current_user' === r.substr(_a, 12).toLowerCase()
                  ? ((e = r.substr(_a, 12)), (_a += 12))
                  : ((e = s), 0 === Ra && Ua(hu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s
                      ? (t, (t = e = 'CURRENT_USER'))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Sf() {
              var t, e, n, o;
              return (
                (t = _a),
                'view' === r.substr(_a, 4).toLowerCase()
                  ? ((e = r.substr(_a, 4)), (_a += 4))
                  : ((e = s), 0 === Ra && Ua(lt)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'VIEW')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Nf() {
              var t;
              return (
                64 === r.charCodeAt(_a)
                  ? ((t = '@'), _a++)
                  : ((t = s), 0 === Ra && Ua(N)),
                t
              );
            }
            function gf() {
              var t;
              return (
                (t = (function () {
                  var t;
                  return (
                    '@@' === r.substr(_a, 2)
                      ? ((t = '@@'), (_a += 2))
                      : ((t = s), 0 === Ra && Ua(Uu)),
                    t
                  );
                })()) === s &&
                  (t = Nf()) === s &&
                  (t = (function () {
                    var t;
                    return (
                      36 === r.charCodeAt(_a)
                        ? ((t = '$'), _a++)
                        : ((t = s), 0 === Ra && Ua(Mu)),
                      t
                    );
                  })()),
                t
              );
            }
            function Rf() {
              var t;
              return (
                ':=' === r.substr(_a, 2)
                  ? ((t = ':='), (_a += 2))
                  : ((t = s), 0 === Ra && Ua(Pu)),
                t
              );
            }
            function Of() {
              var t;
              return (
                61 === r.charCodeAt(_a)
                  ? ((t = '='), _a++)
                  : ((t = s), 0 === Ra && Ua(Qt)),
                t
              );
            }
            function xf() {
              var t, e, n, o;
              return (
                (t = _a),
                'add' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(Fu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'ADD')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function jf() {
              var t, e, n, o;
              return (
                (t = _a),
                'column' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua($u)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'COLUMN')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function kf() {
              var t, e, n, o;
              return (
                (t = _a),
                'index' === r.substr(_a, 5).toLowerCase()
                  ? ((e = r.substr(_a, 5)), (_a += 5))
                  : ((e = s), 0 === Ra && Ua(Hu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'INDEX')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Uf() {
              var t, e, n, o;
              return (
                (t = _a),
                'key' === r.substr(_a, 3).toLowerCase()
                  ? ((e = r.substr(_a, 3)), (_a += 3))
                  : ((e = s), 0 === Ra && Ua(_)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'KEY')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Mf() {
              var t, e, n, o;
              return (
                (t = _a),
                'fulltext' === r.substr(_a, 8).toLowerCase()
                  ? ((e = r.substr(_a, 8)), (_a += 8))
                  : ((e = s), 0 === Ra && Ua(Bu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'FULLTEXT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Df() {
              var t, e, n, o;
              return (
                (t = _a),
                'spatial' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Wu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'SPATIAL')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Pf() {
              var t, e, n, o;
              return (
                (t = _a),
                'unique' === r.substr(_a, 6).toLowerCase()
                  ? ((e = r.substr(_a, 6)), (_a += 6))
                  : ((e = s), 0 === Ra && Ua(I)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'UNIQUE')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Gf() {
              var t, e, n, o;
              return (
                (t = _a),
                'comment' === r.substr(_a, 7).toLowerCase()
                  ? ((e = r.substr(_a, 7)), (_a += 7))
                  : ((e = s), 0 === Ra && Ua(Vu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'COMMENT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Ff() {
              var t, e, n, o;
              return (
                (t = _a),
                'constraint' === r.substr(_a, 10).toLowerCase()
                  ? ((e = r.substr(_a, 10)), (_a += 10))
                  : ((e = s), 0 === Ra && Ua(qu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'CONSTRAINT')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function $f() {
              var t, e, n, o;
              return (
                (t = _a),
                'references' === r.substr(_a, 10).toLowerCase()
                  ? ((e = r.substr(_a, 10)), (_a += 10))
                  : ((e = s), 0 === Ra && Ua(Xu)),
                e !== s
                  ? ((n = _a),
                    Ra++,
                    (o = jc()),
                    Ra--,
                    o === s ? (n = void 0) : ((_a = n), (n = s)),
                    n !== s ? (t, (t = e = 'REFERENCES')) : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Hf() {
              var t;
              return (
                46 === r.charCodeAt(_a)
                  ? ((t = '.'), _a++)
                  : ((t = s), 0 === Ra && Ua(fo)),
                t
              );
            }
            function Yf() {
              var t;
              return (
                44 === r.charCodeAt(_a)
                  ? ((t = ','), _a++)
                  : ((t = s), 0 === Ra && Ua(ta)),
                t
              );
            }
            function Bf() {
              var t;
              return (
                42 === r.charCodeAt(_a)
                  ? ((t = '*'), _a++)
                  : ((t = s), 0 === Ra && Ua(ce)),
                t
              );
            }
            function Wf() {
              var t;
              return (
                40 === r.charCodeAt(_a)
                  ? ((t = '('), _a++)
                  : ((t = s), 0 === Ra && Ua(ht)),
                t
              );
            }
            function Vf() {
              var t;
              return (
                41 === r.charCodeAt(_a)
                  ? ((t = ')'), _a++)
                  : ((t = s), 0 === Ra && Ua(mt)),
                t
              );
            }
            function qf() {
              var t;
              return (
                59 === r.charCodeAt(_a)
                  ? ((t = ';'), _a++)
                  : ((t = s), 0 === Ra && Ua(oa)),
                t
              );
            }
            function Xf() {
              var t;
              return (
                '->' === r.substr(_a, 2)
                  ? ((t = '->'), (_a += 2))
                  : ((t = s), 0 === Ra && Ua(sa)),
                t
              );
            }
            function Kf() {
              var t;
              return (
                '->>' === r.substr(_a, 3)
                  ? ((t = '->>'), (_a += 3))
                  : ((t = s), 0 === Ra && Ua(ua)),
                t
              );
            }
            function Qf() {
              var t;
              return (
                (t = (function () {
                  var t;
                  return (
                    '||' === r.substr(_a, 2)
                      ? ((t = '||'), (_a += 2))
                      : ((t = s), 0 === Ra && Ua(be)),
                    t
                  );
                })()) === s &&
                  (t = (function () {
                    var t;
                    return (
                      '&&' === r.substr(_a, 2)
                        ? ((t = '&&'), (_a += 2))
                        : ((t = s), 0 === Ra && Ua(aa)),
                      t
                    );
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    return (
                      (t = _a),
                      'xor' === r.substr(_a, 3).toLowerCase()
                        ? ((e = r.substr(_a, 3)), (_a += 3))
                        : ((e = s), 0 === Ra && Ua(ia)),
                      e !== s
                        ? ((n = _a),
                          Ra++,
                          (o = jc()),
                          Ra--,
                          o === s ? (n = void 0) : ((_a = n), (n = s)),
                          n !== s ? (t, (t = e = 'XOR')) : ((_a = t), (t = s)))
                        : ((_a = t), (t = s)),
                      t
                    );
                  })()),
                t
              );
            }
            function Zf() {
              var r, t;
              for (r = [], (t = eb()) === s && (t = Jf()); t !== s; )
                (r.push(t), (t = eb()) === s && (t = Jf()));
              return r;
            }
            function zf() {
              var r, t;
              if (((r = []), (t = eb()) === s && (t = Jf()), t !== s))
                for (; t !== s; ) (r.push(t), (t = eb()) === s && (t = Jf()));
              else r = s;
              return r;
            }
            function Jf() {
              var t;
              return (
                (t = (function () {
                  var t, e, n, o, u, a;
                  ((t = _a),
                    '/*' === r.substr(_a, 2)
                      ? ((e = '/*'), (_a += 2))
                      : ((e = s), 0 === Ra && Ua(ca)));
                  if (e !== s) {
                    for (
                      n = [],
                        o = _a,
                        u = _a,
                        Ra++,
                        '*/' === r.substr(_a, 2)
                          ? ((a = '*/'), (_a += 2))
                          : ((a = s), 0 === Ra && Ua(la)),
                        Ra--,
                        a === s ? (u = void 0) : ((_a = u), (u = s)),
                        u !== s && (a = tb()) !== s
                          ? (o = u = [u, a])
                          : ((_a = o), (o = s));
                      o !== s;

                    )
                      (n.push(o),
                        (o = _a),
                        (u = _a),
                        Ra++,
                        '*/' === r.substr(_a, 2)
                          ? ((a = '*/'), (_a += 2))
                          : ((a = s), 0 === Ra && Ua(la)),
                        Ra--,
                        a === s ? (u = void 0) : ((_a = u), (u = s)),
                        u !== s && (a = tb()) !== s
                          ? (o = u = [u, a])
                          : ((_a = o), (o = s)));
                    n !== s
                      ? ('*/' === r.substr(_a, 2)
                          ? ((o = '*/'), (_a += 2))
                          : ((o = s), 0 === Ra && Ua(la)),
                        o !== s ? (t = e = [e, n, o]) : ((_a = t), (t = s)))
                      : ((_a = t), (t = s));
                  } else ((_a = t), (t = s));
                  return t;
                })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a;
                    ((t = _a),
                      '--' === r.substr(_a, 2)
                        ? ((e = '--'), (_a += 2))
                        : ((e = s), 0 === Ra && Ua(fa)));
                    if (e !== s) {
                      for (
                        n = [],
                          o = _a,
                          u = _a,
                          Ra++,
                          a = nb(),
                          Ra--,
                          a === s ? (u = void 0) : ((_a = u), (u = s)),
                          u !== s && (a = tb()) !== s
                            ? (o = u = [u, a])
                            : ((_a = o), (o = s));
                        o !== s;

                      )
                        (n.push(o),
                          (o = _a),
                          (u = _a),
                          Ra++,
                          (a = nb()),
                          Ra--,
                          a === s ? (u = void 0) : ((_a = u), (u = s)),
                          u !== s && (a = tb()) !== s
                            ? (o = u = [u, a])
                            : ((_a = o), (o = s)));
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a;
                    ((t = _a),
                      35 === r.charCodeAt(_a)
                        ? ((e = '#'), _a++)
                        : ((e = s), 0 === Ra && Ua(ba)));
                    if (e !== s) {
                      for (
                        n = [],
                          o = _a,
                          u = _a,
                          Ra++,
                          a = nb(),
                          Ra--,
                          a === s ? (u = void 0) : ((_a = u), (u = s)),
                          u !== s && (a = tb()) !== s
                            ? (o = u = [u, a])
                            : ((_a = o), (o = s));
                        o !== s;

                      )
                        (n.push(o),
                          (o = _a),
                          (u = _a),
                          Ra++,
                          (a = nb()),
                          Ra--,
                          a === s ? (u = void 0) : ((_a = u), (u = s)),
                          u !== s && (a = tb()) !== s
                            ? (o = u = [u, a])
                            : ((_a = o), (o = s)));
                      n !== s ? (t = e = [e, n]) : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                    return t;
                  })()),
                t
              );
            }
            function rb() {
              var r, t, e, n, o, u, a;
              return (
                (r = _a),
                (t = Gf()) !== s && Zf() !== s
                  ? ((e = Of()) === s && (e = null),
                    e !== s && Zf() !== s && (n = zc()) !== s
                      ? (r,
                        (u = e),
                        (a = n),
                        (r = t =
                          {
                            type: (o = t).toLowerCase(),
                            keyword: o.toLowerCase(),
                            symbol: u,
                            value: a,
                          }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function tb() {
              var t;
              return (
                r.length > _a
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(pa)),
                t
              );
            }
            function eb() {
              var t;
              return (
                va.test(r.charAt(_a))
                  ? ((t = r.charAt(_a)), _a++)
                  : ((t = s), 0 === Ra && Ua(da)),
                t
              );
            }
            function nb() {
              var t, e;
              if (
                (t = (function () {
                  var t, e;
                  ((t = _a),
                    Ra++,
                    r.length > _a
                      ? ((e = r.charAt(_a)), _a++)
                      : ((e = s), 0 === Ra && Ua(pa)));
                  (Ra--, e === s ? (t = void 0) : ((_a = t), (t = s)));
                  return t;
                })()) === s
              )
                if (
                  ((t = []),
                  co.test(r.charAt(_a))
                    ? ((e = r.charAt(_a)), _a++)
                    : ((e = s), 0 === Ra && Ua(lo)),
                  e !== s)
                )
                  for (; e !== s; )
                    (t.push(e),
                      co.test(r.charAt(_a))
                        ? ((e = r.charAt(_a)), _a++)
                        : ((e = s), 0 === Ra && Ua(lo)));
                else t = s;
              return t;
            }
            function ob() {
              var t, e;
              return (
                (t = _a),
                _a,
                (Nb = []),
                (!0 ? void 0 : s) !== s && Zf() !== s
                  ? ((e = sb()) === s &&
                      (e = (function () {
                        var t, e;
                        ((t = _a),
                          (function () {
                            var t;
                            return (
                              'return' === r.substr(_a, 6).toLowerCase()
                                ? ((t = r.substr(_a, 6)), (_a += 6))
                                : ((t = s), 0 === Ra && Ua(Du)),
                              t
                            );
                          })() !== s &&
                          Zf() !== s &&
                          (e = ub()) !== s
                            ? (t, (t = { type: 'return', expr: e }))
                            : ((_a = t), (t = s)));
                        return t;
                      })()),
                    e !== s
                      ? (t, (t = { stmt: e, vars: Nb }))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function sb() {
              var r, t, e, n;
              return (
                (r = _a),
                (t = vb()) === s && (t = db()),
                t !== s && Zf() !== s
                  ? ((e = Rf()) === s && (e = Of()),
                    e !== s && Zf() !== s && (n = ub()) !== s
                      ? (r, (r = t = ya(t, e, n)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function ub() {
              var t;
              return (
                (t = yi()) === s &&
                  (t = (function () {
                    var r, t, e, n, o;
                    ((r = _a),
                      (t = vb()) !== s &&
                      Zf() !== s &&
                      (e = Pi()) !== s &&
                      Zf() !== s &&
                      (n = vb()) !== s &&
                      Zf() !== s &&
                      (o = Fi()) !== s
                        ? (r,
                          (r = t =
                            {
                              type: 'join',
                              ltable: t,
                              rtable: n,
                              op: e,
                              on: o,
                            }))
                        : ((_a = r), (r = s)));
                    return r;
                  })()) === s &&
                  (t = ab()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (function () {
                        var t;
                        return (
                          91 === r.charCodeAt(_a)
                            ? ((t = '['), _a++)
                            : ((t = s), 0 === Ra && Ua(ea)),
                          t
                        );
                      })() !== s &&
                      Zf() !== s &&
                      (e = pb()) !== s &&
                      Zf() !== s &&
                      (function () {
                        var t;
                        return (
                          93 === r.charCodeAt(_a)
                            ? ((t = ']'), _a++)
                            : ((t = s), 0 === Ra && Ua(na)),
                          t
                        );
                      })() !== s
                        ? (t, (t = { type: 'array', value: e }))
                        : ((_a = t), (t = s)));
                    return t;
                  })()),
                t
              );
            }
            function ab() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = ib()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Cc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = ib()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Cc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = ib()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = zt(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function ib() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = cb()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = mc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = cb()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = mc()) !== s &&
                    (a = Zf()) !== s &&
                    (i = cb()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = zt(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function cb() {
              var r, t, e;
              return (
                (r = fb()) === s &&
                  (r = Qc()) === s &&
                  (r = vb()) === s &&
                  (r = Tc()) === s &&
                  (r = bb()) === s &&
                  (r = Mc()) === s &&
                  ((r = _a),
                  Wf() !== s &&
                  Zf() !== s &&
                  (t = ab()) !== s &&
                  Zf() !== s &&
                  Vf() !== s
                    ? (r, ((e = t).parentheses = !0), (r = e))
                    : ((_a = r), (r = s))),
                r
              );
            }
            function lb() {
              var r, t, e, n, o, u, a;
              return (
                (r = _a),
                (t = xc()) === s && (t = Sc()),
                t !== s
                  ? ((e = _a),
                    (n = Zf()) !== s && (o = Hf()) !== s && (u = Zf()) !== s
                      ? ((a = xc()) === s && (a = Sc()),
                        a !== s ? (e = n = [n, o, u, a]) : ((_a = e), (e = s)))
                      : ((_a = e), (e = s)),
                    e === s && (e = null),
                    e !== s
                      ? (r,
                        (r = t =
                          (function (r, t) {
                            let e = r;
                            return (null !== t && (e = `${r}.${t[3]}`), e);
                          })(t, e)))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r === s &&
                  ((r = _a),
                  (t = xc()) !== s &&
                    (r,
                    (t = (function (r) {
                      const t = r.toUpperCase();
                      return !0 === hb[t] ? t : r;
                    })(t))),
                  (r = t) === s && (r = Sc())),
                r
              );
            }
            function fb() {
              var r, t, e;
              return (
                (r = _a),
                (t = lb()) !== s && Zf() !== s && Wf() !== s && Zf() !== s
                  ? ((e = pb()) === s && (e = null),
                    e !== s && Zf() !== s && Vf() !== s
                      ? (r,
                        (r = t =
                          {
                            type: 'function',
                            name: t,
                            args: { type: 'expr_list', value: e },
                          }))
                      : ((_a = r), (r = s)))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function bb() {
              var r, t;
              return (
                (r = _a),
                (t = lb()) !== s &&
                  (r, (t = { type: 'function', name: t, args: null })),
                (r = t)
              );
            }
            function pb() {
              var r, t, e, n, o, u, a, i;
              if (((r = _a), (t = cb()) !== s)) {
                for (
                  e = [],
                    n = _a,
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = cb()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s));
                  n !== s;

                )
                  (e.push(n),
                    (n = _a),
                    (o = Zf()) !== s &&
                    (u = Yf()) !== s &&
                    (a = Zf()) !== s &&
                    (i = cb()) !== s
                      ? (n = o = [o, u, a, i])
                      : ((_a = n), (n = s)));
                e !== s ? (r, (r = t = A(t, e))) : ((_a = r), (r = s));
              } else ((_a = r), (r = s));
              return r;
            }
            function vb() {
              var r, t, e, n, o;
              return (
                (r = _a),
                (t = gf()) !== s && (e = db()) !== s
                  ? (r,
                    (n = t),
                    (o = e),
                    (r = t = { type: 'var', ...o, prefix: n }))
                  : ((_a = r), (r = s)),
                r
              );
            }
            function db() {
              var t, e, n, o, u;
              return (
                (t = _a),
                (e = xc()) !== s &&
                (n = (function () {
                  var t, e, n, o, u;
                  ((t = _a),
                    (e = []),
                    (n = _a),
                    46 === r.charCodeAt(_a)
                      ? ((o = '.'), _a++)
                      : ((o = s), 0 === Ra && Ua(fo)));
                  o !== s && (u = xc()) !== s
                    ? (n = o = [o, u])
                    : ((_a = n), (n = s));
                  for (; n !== s; )
                    (e.push(n),
                      (n = _a),
                      46 === r.charCodeAt(_a)
                        ? ((o = '.'), _a++)
                        : ((o = s), 0 === Ra && Ua(fo)),
                      o !== s && (u = xc()) !== s
                        ? (n = o = [o, u])
                        : ((_a = n), (n = s)));
                  e !== s &&
                    (t,
                    (e = (function (r) {
                      const t = [];
                      for (let e = 0; e < r.length; e++) t.push(r[e][1]);
                      return t;
                    })(e)));
                  return (t = e);
                })()) !== s
                  ? (t,
                    (o = e),
                    (u = n),
                    Nb.push(o),
                    (t = e =
                      { type: 'var', name: o, members: u, prefix: null }))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = el()) !== s &&
                    (t,
                    (e = {
                      type: 'var',
                      name: e.value,
                      members: [],
                      quoted: null,
                      prefix: null,
                    })),
                  (t = e)),
                t
              );
            }
            function yb() {
              var t;
              return (
                (t = wb()) === s &&
                  (t = (function () {
                    var t, e, n, o, u, a, i, c, l, f, b, p;
                    ((t = _a),
                      (e = uf()) === s &&
                        (e = af()) === s &&
                        (e = lf()) === s &&
                        (e = ff()) === s &&
                        (e = bf()) === s &&
                        (e = pf()) === s &&
                        (e = vf()) === s &&
                        (e = df()) === s &&
                        (e = yf()) === s &&
                        (e = wf()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'bit' === r.substr(_a, 3).toLowerCase()
                              ? ((e = r.substr(_a, 3)), (_a += 3))
                              : ((e = s), 0 === Ra && Ua(Hs)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'BIT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()));
                    if (e !== s)
                      if ((n = Zf()) !== s)
                        if ((o = Wf()) !== s)
                          if ((u = Zf()) !== s) {
                            if (
                              ((a = []),
                              Et.test(r.charAt(_a))
                                ? ((i = r.charAt(_a)), _a++)
                                : ((i = s), 0 === Ra && Ua(At)),
                              i !== s)
                            )
                              for (; i !== s; )
                                (a.push(i),
                                  Et.test(r.charAt(_a))
                                    ? ((i = r.charAt(_a)), _a++)
                                    : ((i = s), 0 === Ra && Ua(At)));
                            else a = s;
                            if (a !== s)
                              if ((i = Zf()) !== s) {
                                if (((c = _a), (l = Yf()) !== s))
                                  if ((f = Zf()) !== s) {
                                    if (
                                      ((b = []),
                                      Et.test(r.charAt(_a))
                                        ? ((p = r.charAt(_a)), _a++)
                                        : ((p = s), 0 === Ra && Ua(At)),
                                      p !== s)
                                    )
                                      for (; p !== s; )
                                        (b.push(p),
                                          Et.test(r.charAt(_a))
                                            ? ((p = r.charAt(_a)), _a++)
                                            : ((p = s), 0 === Ra && Ua(At)));
                                    else b = s;
                                    b !== s
                                      ? (c = l = [l, f, b])
                                      : ((_a = c), (c = s));
                                  } else ((_a = c), (c = s));
                                else ((_a = c), (c = s));
                                (c === s && (c = null),
                                  c !== s &&
                                  (l = Zf()) !== s &&
                                  (f = Vf()) !== s &&
                                  (b = Zf()) !== s
                                    ? ((p = Lb()) === s && (p = null),
                                      p !== s
                                        ? (t,
                                          (v = c),
                                          (d = p),
                                          (e = {
                                            dataType: e,
                                            length: parseInt(a.join(''), 10),
                                            scale:
                                              v && parseInt(v[2].join(''), 10),
                                            parentheses: !0,
                                            suffix: d,
                                          }),
                                          (t = e))
                                        : ((_a = t), (t = s)))
                                    : ((_a = t), (t = s)));
                              } else ((_a = t), (t = s));
                            else ((_a = t), (t = s));
                          } else ((_a = t), (t = s));
                        else ((_a = t), (t = s));
                      else ((_a = t), (t = s));
                    else ((_a = t), (t = s));
                    var v, d;
                    if (t === s) {
                      if (
                        ((t = _a),
                        (e = uf()) === s &&
                          (e = af()) === s &&
                          (e = lf()) === s &&
                          (e = ff()) === s &&
                          (e = bf()) === s &&
                          (e = pf()) === s &&
                          (e = vf()) === s &&
                          (e = df()) === s &&
                          (e = yf()) === s &&
                          (e = wf()),
                        e !== s)
                      ) {
                        if (
                          ((n = []),
                          Et.test(r.charAt(_a))
                            ? ((o = r.charAt(_a)), _a++)
                            : ((o = s), 0 === Ra && Ua(At)),
                          o !== s)
                        )
                          for (; o !== s; )
                            (n.push(o),
                              Et.test(r.charAt(_a))
                                ? ((o = r.charAt(_a)), _a++)
                                : ((o = s), 0 === Ra && Ua(At)));
                        else n = s;
                        n !== s && (o = Zf()) !== s
                          ? ((u = Lb()) === s && (u = null),
                            u !== s
                              ? (t,
                                (e = (function (r, t, e) {
                                  return {
                                    dataType: r,
                                    length: parseInt(t.join(''), 10),
                                    suffix: e,
                                  };
                                })(e, n, u)),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s));
                      } else ((_a = t), (t = s));
                      t === s &&
                        ((t = _a),
                        (e = uf()) === s &&
                          (e = af()) === s &&
                          (e = lf()) === s &&
                          (e = ff()) === s &&
                          (e = bf()) === s &&
                          (e = pf()) === s &&
                          (e = vf()) === s &&
                          (e = df()) === s &&
                          (e = yf()) === s &&
                          (e = wf()),
                        e !== s && (n = Zf()) !== s
                          ? ((o = Lb()) === s && (o = null),
                            o !== s && (u = Zf()) !== s
                              ? (t,
                                (e = (function (r, t) {
                                  return { dataType: r, suffix: t };
                                })(e, o)),
                                (t = e))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)));
                    }
                    return t;
                  })()) === s &&
                  (t = Cb()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        return (
                          (t = _a),
                          'json' === r.substr(_a, 4).toLowerCase()
                            ? ((e = r.substr(_a, 4)), (_a += 4))
                            : ((e = s), 0 === Ra && Ua(zs)),
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'JSON'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t
                        );
                      })()) !== s && (t, (e = Ea(e))));
                    return (t = e);
                  })()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        return (
                          (t = _a),
                          'tinytext' === r.substr(_a, 8).toLowerCase()
                            ? ((e = r.substr(_a, 8)), (_a += 8))
                            : ((e = s), 0 === Ra && Ua(eu)),
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'TINYTEXT'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t
                        );
                      })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'text' === r.substr(_a, 4).toLowerCase()
                              ? ((e = r.substr(_a, 4)), (_a += 4))
                              : ((e = s), 0 === Ra && Ua(nu)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'TEXT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'mediumtext' === r.substr(_a, 10).toLowerCase()
                              ? ((e = r.substr(_a, 10)), (_a += 10))
                              : ((e = s), 0 === Ra && Ua(ou)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'MEDIUMTEXT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'longtext' === r.substr(_a, 8).toLowerCase()
                              ? ((e = r.substr(_a, 8)), (_a += 8))
                              : ((e = s), 0 === Ra && Ua(su)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'LONGTEXT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()));
                    e !== s && (t, (e = Ia(e)));
                    return (t = e);
                  })()) === s &&
                  (t = (function () {
                    var t, e, n;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        return (
                          (t = _a),
                          'enum' === r.substr(_a, 4).toLowerCase()
                            ? ((e = r.substr(_a, 4)), (_a += 4))
                            : ((e = s), 0 === Ra && Ua(au)),
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'ENUM'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t
                        );
                      })()) === s && (e = _l()));
                    e !== s && Zf() !== s && (n = tc()) !== s
                      ? (t,
                        (o = e),
                        ((u = n).parentheses = !0),
                        (t = e = { dataType: o, expr: u }))
                      : ((_a = t), (t = s));
                    var o, u;
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      'boolean' === r.substr(_a, 7).toLowerCase()
                        ? ((e = r.substr(_a, 7)), (_a += 7))
                        : ((e = s), 0 === Ra && Ua(wa)));
                    e !== s && (t, (e = { dataType: 'BOOLEAN' }));
                    return (t = e);
                  })()) === s &&
                  (t = (function () {
                    var t, e, n, o;
                    ((t = _a),
                      (e = nf()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'varbinary' === r.substr(_a, 9).toLowerCase()
                              ? ((e = r.substr(_a, 9)), (_a += 9))
                              : ((e = s), 0 === Ra && Ua($s)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'VARBINARY'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()));
                    if (e !== s)
                      if (Zf() !== s)
                        if (Wf() !== s)
                          if (Zf() !== s) {
                            if (
                              ((n = []),
                              Et.test(r.charAt(_a))
                                ? ((o = r.charAt(_a)), _a++)
                                : ((o = s), 0 === Ra && Ua(At)),
                              o !== s)
                            )
                              for (; o !== s; )
                                (n.push(o),
                                  Et.test(r.charAt(_a))
                                    ? ((o = r.charAt(_a)), _a++)
                                    : ((o = s), 0 === Ra && Ua(At)));
                            else n = s;
                            n !== s && (o = Zf()) !== s && Vf() !== s
                              ? (t,
                                (e = {
                                  dataType: e,
                                  length: parseInt(n.join(''), 10),
                                }),
                                (t = e))
                              : ((_a = t), (t = s));
                          } else ((_a = t), (t = s));
                        else ((_a = t), (t = s));
                      else ((_a = t), (t = s));
                    else ((_a = t), (t = s));
                    t === s &&
                      ((t = _a), (e = nf()) !== s && (t, (e = Ea(e))), (t = e));
                    return t;
                  })()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      'blob' === r.substr(_a, 4).toLowerCase()
                        ? ((e = r.substr(_a, 4)), (_a += 4))
                        : ((e = s), 0 === Ra && Ua(La)));
                    e === s &&
                      ('tinyblob' === r.substr(_a, 8).toLowerCase()
                        ? ((e = r.substr(_a, 8)), (_a += 8))
                        : ((e = s), 0 === Ra && Ua(Ca)),
                      e === s &&
                        ('mediumblob' === r.substr(_a, 10).toLowerCase()
                          ? ((e = r.substr(_a, 10)), (_a += 10))
                          : ((e = s), 0 === Ra && Ua(ha)),
                        e === s &&
                          ('longblob' === r.substr(_a, 8).toLowerCase()
                            ? ((e = r.substr(_a, 8)), (_a += 8))
                            : ((e = s), 0 === Ra && Ua(ma)))));
                    e !== s && (t, (e = { dataType: e.toUpperCase() }));
                    return (t = e);
                  })()) === s &&
                  (t = (function () {
                    var t, e;
                    ((t = _a),
                      (e = (function () {
                        var t, e, n, o;
                        return (
                          (t = _a),
                          'geometry' === r.substr(_a, 8).toLowerCase()
                            ? ((e = r.substr(_a, 8)), (_a += 8))
                            : ((e = s), 0 === Ra && Ua(Su)),
                          e !== s
                            ? ((n = _a),
                              Ra++,
                              (o = jc()),
                              Ra--,
                              o === s ? (n = void 0) : ((_a = n), (n = s)),
                              n !== s
                                ? (t, (t = e = 'GEOMETRY'))
                                : ((_a = t), (t = s)))
                            : ((_a = t), (t = s)),
                          t
                        );
                      })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'point' === r.substr(_a, 5).toLowerCase()
                              ? ((e = r.substr(_a, 5)), (_a += 5))
                              : ((e = s), 0 === Ra && Ua(Nu)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'POINT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'linestring' === r.substr(_a, 10).toLowerCase()
                              ? ((e = r.substr(_a, 10)), (_a += 10))
                              : ((e = s), 0 === Ra && Ua(gu)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'LINESTRING'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'polygon' === r.substr(_a, 7).toLowerCase()
                              ? ((e = r.substr(_a, 7)), (_a += 7))
                              : ((e = s), 0 === Ra && Ua(Ru)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'POLYGON'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'multipoint' === r.substr(_a, 10).toLowerCase()
                              ? ((e = r.substr(_a, 10)), (_a += 10))
                              : ((e = s), 0 === Ra && Ua(Ou)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'MULTIPOINT'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'multilinestring' === r.substr(_a, 15).toLowerCase()
                              ? ((e = r.substr(_a, 15)), (_a += 15))
                              : ((e = s), 0 === Ra && Ua(xu)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'MULTILINESTRING'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'multipolygon' === r.substr(_a, 12).toLowerCase()
                              ? ((e = r.substr(_a, 12)), (_a += 12))
                              : ((e = s), 0 === Ra && Ua(ju)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'MULTIPOLYGON'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()) === s &&
                        (e = (function () {
                          var t, e, n, o;
                          return (
                            (t = _a),
                            'geometrycollection' ===
                            r.substr(_a, 18).toLowerCase()
                              ? ((e = r.substr(_a, 18)), (_a += 18))
                              : ((e = s), 0 === Ra && Ua(ku)),
                            e !== s
                              ? ((n = _a),
                                Ra++,
                                (o = jc()),
                                Ra--,
                                o === s ? (n = void 0) : ((_a = n), (n = s)),
                                n !== s
                                  ? (t, (t = e = 'GEOMETRYCOLLECTION'))
                                  : ((_a = t), (t = s)))
                              : ((_a = t), (t = s)),
                            t
                          );
                        })()));
                    e !== s && (t, (e = Ia(e)));
                    return (t = e);
                  })()),
                t
              );
            }
            function wb() {
              var t, e, n, o;
              if (((t = _a), (e = of()) === s && (e = sf()), e !== s))
                if (Zf() !== s)
                  if (Wf() !== s)
                    if (Zf() !== s) {
                      if (
                        ((n = []),
                        Et.test(r.charAt(_a))
                          ? ((o = r.charAt(_a)), _a++)
                          : ((o = s), 0 === Ra && Ua(At)),
                        o !== s)
                      )
                        for (; o !== s; )
                          (n.push(o),
                            Et.test(r.charAt(_a))
                              ? ((o = r.charAt(_a)), _a++)
                              : ((o = s), 0 === Ra && Ua(At)));
                      else n = s;
                      n !== s && (o = Zf()) !== s && Vf() !== s
                        ? (t,
                          (t = e =
                            {
                              dataType: e,
                              length: parseInt(n.join(''), 10),
                              parentheses: !0,
                            }))
                        : ((_a = t), (t = s));
                    } else ((_a = t), (t = s));
                  else ((_a = t), (t = s));
                else ((_a = t), (t = s));
              else ((_a = t), (t = s));
              return (
                t === s &&
                  ((t = _a),
                  (e = of()) !== s && (t, (e = Ea(e))),
                  (t = e) === s &&
                    ((t = _a), (e = sf()) !== s && (t, (e = Ea(e))), (t = e))),
                t
              );
            }
            function Lb() {
              var t, e, n;
              return (
                (t = _a),
                (e = cf()) === s && (e = null),
                e !== s && Zf() !== s
                  ? ((n = (function () {
                      var t, e, n, o;
                      return (
                        (t = _a),
                        'zerofill' === r.substr(_a, 8).toLowerCase()
                          ? ((e = r.substr(_a, 8)), (_a += 8))
                          : ((e = s), 0 === Ra && Ua(Qs)),
                        e !== s
                          ? ((n = _a),
                            Ra++,
                            (o = jc()),
                            Ra--,
                            o === s ? (n = void 0) : ((_a = n), (n = s)),
                            n !== s
                              ? (t, (t = e = 'ZEROFILL'))
                              : ((_a = t), (t = s)))
                          : ((_a = t), (t = s)),
                        t
                      );
                    })()) === s && (n = null),
                    n !== s
                      ? (t,
                        (t = e =
                          (function (r, t) {
                            const e = [];
                            return (r && e.push(r), t && e.push(t), e);
                          })(e, n)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t
              );
            }
            function Cb() {
              var t, e, n, o;
              return (
                (t = _a),
                (e = Lf()) === s &&
                  (e = Cf()) === s &&
                  (e = mf()) === s &&
                  (e = Ef()) === s &&
                  (e = Af()),
                e !== s && Zf() !== s && Wf() !== s && Zf() !== s
                  ? (Aa.test(r.charAt(_a))
                      ? ((n = r.charAt(_a)), _a++)
                      : ((n = s), 0 === Ra && Ua(Ta)),
                    n !== s && Zf() !== s && Vf() !== s && Zf() !== s
                      ? ((o = Lb()) === s && (o = null),
                        o !== s
                          ? (t,
                            (t = e =
                              {
                                dataType: e,
                                length: parseInt(n, 10),
                                parentheses: !0,
                              }))
                          : ((_a = t), (t = s)))
                      : ((_a = t), (t = s)))
                  : ((_a = t), (t = s)),
                t === s &&
                  ((t = _a),
                  (e = Lf()) === s &&
                    (e = Cf()) === s &&
                    (e = mf()) === s &&
                    (e = Ef()) === s &&
                    (e = Af()),
                  e !== s && (t, (e = Ea(e))),
                  (t = e)),
                t
              );
            }
            const hb = {
              ALTER: !0,
              ALL: !0,
              ADD: !0,
              AND: !0,
              AS: !0,
              ASC: !0,
              ANALYZE: !0,
              ACCESSIBLE: !0,
              BEFORE: !0,
              BETWEEN: !0,
              BIGINT: !0,
              BLOB: !0,
              BOTH: !0,
              BY: !0,
              BOOLEAN: !0,
              CALL: !0,
              CASCADE: !0,
              CASE: !0,
              CHAR: !0,
              CHECK: !0,
              COLLATE: !0,
              CONDITION: !0,
              CONSTRAINT: !0,
              CONTINUE: !0,
              CONVERT: !0,
              CREATE: !0,
              CROSS: !0,
              CURRENT_DATE: !0,
              CURRENT_TIME: !0,
              CURRENT_TIMESTAMP: !0,
              CURRENT_USER: !0,
              CURSOR: !0,
              DATABASE: !0,
              DATABASES: !0,
              DAY_HOUR: !0,
              DAY_MICROSECOND: !0,
              DAY_MINUTE: !0,
              DAY_SECOND: !0,
              DEC: !0,
              DECIMAL: !0,
              DECLARE: !0,
              DEFAULT: !0,
              DELAYED: !0,
              DELETE: !0,
              DESC: !0,
              DESCRIBE: !0,
              DETERMINISTIC: !0,
              DISTINCT: !0,
              DISTINCTROW: !0,
              DIV: !0,
              DROP: !0,
              DOUBLE: !0,
              DUAL: !0,
              ELSE: !0,
              EACH: !0,
              ELSEIF: !0,
              ENCLOSED: !0,
              ESCAPED: !0,
              EXCEPT: !0,
              EXISTS: !0,
              EXIT: !0,
              EXPLAIN: !0,
              FALSE: !0,
              FULL: !0,
              FROM: !0,
              FETCH: !0,
              FLOAT: !0,
              FLOAT4: !0,
              FLOAT8: !0,
              FOR: !0,
              FORCE: !0,
              FOREIGN: !0,
              FULLTEXT: !0,
              FUNCTION: !0,
              GENERATED: !0,
              GET: !0,
              GO: !0,
              GRANT: !0,
              GROUP: !0,
              GROUPING: !0,
              GROUPS: !0,
              HAVING: !0,
              HIGH_PRIORITY: !0,
              HOUR_MICROSECOND: !0,
              HOUR_MINUTE: !0,
              HOUR_SECOND: !0,
              IGNORE: !0,
              IN: !0,
              INNER: !0,
              INFILE: !0,
              INOUT: !0,
              INSENSITIVE: !0,
              INSERT: !0,
              INTERSECT: !0,
              INT: !0,
              INT1: !0,
              INT2: !0,
              INT3: !0,
              INT4: !0,
              INT8: !0,
              INTEGER: !0,
              INTERVAL: !0,
              INTO: !0,
              IO_AFTER_GTIDS: !0,
              IO_BEFORE_GTIDS: !0,
              IS: !0,
              ITERATE: !0,
              JOIN: !0,
              JSON_TABLE: !0,
              KEY: !0,
              KEYS: !0,
              KILL: !0,
              LAG: !0,
              LAST_VALUE: !0,
              LATERAL: !0,
              LEAD: !0,
              LEADING: !0,
              LEAVE: !0,
              LEFT: !0,
              LIKE: !0,
              LIMIT: !0,
              LINEAR: !0,
              LINES: !0,
              LOAD: !0,
              LOCALTIME: !0,
              LOCALTIMESTAMP: !0,
              LOCK: !0,
              LONG: !0,
              LONGBLOB: !0,
              LONGTEXT: !0,
              LOOP: !0,
              LOW_PRIORITY: !0,
              MASTER_BIND: !0,
              MATCH: !0,
              MAXVALUE: !0,
              MEDIUMBLOB: !0,
              MEDIUMINT: !0,
              MEDIUMTEXT: !0,
              MIDDLEINT: !0,
              MINUTE_MICROSECOND: !0,
              MINUTE_SECOND: !0,
              MINUS: !0,
              MOD: !0,
              MODIFIES: !0,
              NATURAL: !0,
              NOT: !0,
              NO_WRITE_TO_BINLOG: !0,
              NTH_VALUE: !0,
              NTILE: !0,
              NULL: !0,
              NUMERIC: !0,
              OF: !0,
              ON: !0,
              OPTIMIZE: !0,
              OPTIMIZER_COSTS: !0,
              OPTION: !0,
              OPTIONALLY: !0,
              OR: !0,
              ORDER: !0,
              OUT: !0,
              OUTER: !0,
              OUTFILE: !0,
              OVER: !0,
              PARTITION: !0,
              PERCENT_RANK: !0,
              PRECISION: !0,
              PRIMARY: !0,
              PROCEDURE: !0,
              PURGE: !0,
              RANGE: !0,
              RANK: !0,
              READ: !0,
              READS: !0,
              READ_WRITE: !0,
              REAL: !0,
              RECURSIVE: !0,
              REFERENCES: !0,
              REGEXP: !0,
              RELEASE: !0,
              RENAME: !0,
              REPEAT: !0,
              REPLACE: !0,
              REQUIRE: !0,
              RESIGNAL: !0,
              RESTRICT: !0,
              RETURN: !0,
              REVOKE: !0,
              RIGHT: !0,
              RLIKE: !0,
              ROW: !0,
              ROWS: !0,
              ROW_NUMBER: !0,
              SCHEMA: !0,
              SCHEMAS: !0,
              SELECT: !0,
              SENSITIVE: !0,
              SEPARATOR: !0,
              SET: !0,
              SHOW: !0,
              SIGNAL: !0,
              SMALLINT: !0,
              SPATIAL: !0,
              SPECIFIC: !0,
              SQL: !0,
              SQLEXCEPTION: !0,
              SQLSTATE: !0,
              SQLWARNING: !0,
              SQL_BIG_RESULT: !0,
              SSL: !0,
              STARTING: !0,
              STORED: !0,
              STRAIGHT_JOIN: !0,
              SYSTEM: !0,
              TABLE: !0,
              TERMINATED: !0,
              THEN: !0,
              TINYBLOB: !0,
              TINYINT: !0,
              TINYTEXT: !0,
              TO: !0,
              TRAILING: !0,
              TRIGGER: !0,
              TRUE: !0,
              UNION: !0,
              UNIQUE: !0,
              UNLOCK: !0,
              UNSIGNED: !0,
              UPDATE: !0,
              USAGE: !0,
              USE: !0,
              USING: !0,
              UTC_DATE: !0,
              UTC_TIME: !0,
              UTC_TIMESTAMP: !0,
              VALUES: !0,
              VARBINARY: !0,
              VARCHAR: !0,
              VARCHARACTER: !0,
              VARYING: !0,
              VIRTUAL: !0,
              WHEN: !0,
              WHERE: !0,
              WHILE: !0,
              WINDOW: !0,
              WITH: !0,
              WRITE: !0,
              XOR: !0,
              YEAR_MONTH: !0,
              ZEROFILL: !0,
            };
            function mb(r, t) {
              return { type: 'unary_expr', operator: r, expr: t };
            }
            function Eb(r, t, e) {
              return { type: 'binary_expr', operator: r, left: t, right: e };
            }
            function Ab(r) {
              const t = n(Number.MAX_SAFE_INTEGER);
              return !(n(r) < t);
            }
            function Tb(r, t, e = 3) {
              const n = [r];
              for (let r = 0; r < t.length; r++)
                (delete t[r][e].tableList,
                  delete t[r][e].columnList,
                  n.push(t[r][e]));
              return n;
            }
            function Ib(r, t) {
              let e = r;
              for (let r = 0; r < t.length; r++) e = Eb(t[r][1], e, t[r][3]);
              return e;
            }
            function _b(r) {
              const t = Ob[r];
              return t || r || null;
            }
            function Sb(r) {
              const t = new Set();
              for (let e of r.keys()) {
                const r = e.split('::');
                if (!r) {
                  t.add(e);
                  break;
                }
                (r && r[1] && (r[1] = _b(r[1])), t.add(r.join('::')));
              }
              return Array.from(t);
            }
            let Nb = [];
            const gb = new Set(),
              Rb = new Set(),
              Ob = {};
            if ((e = a()) !== s && _a === r.length) return e;
            throw (
              e !== s && _a < r.length && Ua({ type: 'end' }),
              Ma(
                ga,
                Na < r.length ? r.charAt(Na) : null,
                Na < r.length ? ka(Na, Na + 1) : ka(Na, Na)
              )
            );
          },
        }));
    },
    function (r, t, e) {
      r.exports = e(3);
    },
    function (r, t) {
      r.exports = require('big-integer');
    },
    function (r, t, e) {
      'use strict';
      (e.r(t),
        e.d(t, 'Parser', function () {
          return Ct;
        }),
        e.d(t, 'util', function () {
          return n;
        }));
      var n = {};
      function o(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return s(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          (function (r, t) {
            if (!r) return;
            if ('string' == typeof r) return s(r, t);
            var e = Object.prototype.toString.call(r).slice(8, -1);
            'Object' === e && r.constructor && (e = r.constructor.name);
            if ('Map' === e || 'Set' === e) return Array.from(r);
            if (
              'Arguments' === e ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
            )
              return s(r, t);
          })(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function s(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function u(r) {
        if (!r) return [];
        var t = r.keyword,
          e = r.type;
        return [t.toUpperCase(), pr(e)];
      }
      function a(r) {
        if (r) {
          var t = r.type,
            e = r.expr,
            n = r.symbol,
            s = t.toUpperCase(),
            a = [];
          switch ((a.push(s), s)) {
            case 'KEY_BLOCK_SIZE':
              (n && a.push(n), a.push(dr(e)));
              break;
            case 'BTREE':
            case 'HASH':
              ((a.length = 0), a.push.apply(a, o(u(r))));
              break;
            case 'WITH PARSER':
              a.push(e);
              break;
            case 'VISIBLE':
            case 'INVISIBLE':
              break;
            case 'COMMENT':
              (a.shift(), a.push(hr(r)));
              break;
            case 'DATA_COMPRESSION':
              a.push(n, pr(e.value), wr(e.on));
              break;
            default:
              a.push(n, dr(e));
          }
          return a.filter(vr).join(' ');
        }
      }
      function i(r) {
        return r ? r.map(a) : [];
      }
      function c(r) {
        var t = r.constraint_type,
          e = r.index_type,
          n = r.index_options,
          s = void 0 === n ? [] : n,
          a = r.definition,
          c = r.on,
          l = r.with,
          f = [];
        if ((f.push.apply(f, o(u(e))), a && a.length)) {
          var b =
            'CHECK' === pr(t)
              ? '('.concat(st(a[0]), ')')
              : '('.concat(
                  a
                    .map(function (r) {
                      return st(r);
                    })
                    .join(', '),
                  ')'
                );
          f.push(b);
        }
        return (
          f.push(i(s).join(' ')),
          l && f.push('WITH ('.concat(i(l).join(', '), ')')),
          c && f.push('ON ['.concat(c, ']')),
          f
        );
      }
      function l(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return f(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          (function (r, t) {
            if (!r) return;
            if ('string' == typeof r) return f(r, t);
            var e = Object.prototype.toString.call(r).slice(8, -1);
            'Object' === e && r.constructor && (e = r.constructor.name);
            if ('Map' === e || 'Set' === e) return Array.from(r);
            if (
              'Arguments' === e ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
            )
              return f(r, t);
          })(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function f(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function b(r) {
        if (r) {
          var t = r.constraint,
            e = r.constraint_type,
            n = r.enforced,
            o = r.index,
            s = r.keyword,
            u = r.reference_definition,
            a = [],
            i = ar().database;
          (a.push(pr(s)), a.push(fr(t)));
          var f = pr(e);
          return (
            'sqlite' === i && 'UNIQUE KEY' === f && (f = 'UNIQUE'),
            a.push(f),
            a.push('sqlite' !== i && fr(o)),
            a.push.apply(a, l(c(r))),
            a.push.apply(a, l(q(u))),
            a.push(pr(n)),
            a.filter(vr).join(' ')
          );
        }
      }
      function p(r) {
        if ('string' == typeof r) return r;
        var t = r.window_specification;
        return '('.concat(
          (function (r) {
            var t = r.name,
              e = r.partitionby,
              n = r.orderby,
              o = r.window_frame_clause;
            return [t, at(e, 'partition by'), at(n, 'order by'), pr(o)]
              .filter(vr)
              .join(' ');
          })(t),
          ')'
        );
      }
      function v(r) {
        var t = r.name,
          e = r.as_window_specification;
        return ''.concat(t, ' AS ').concat(p(e));
      }
      function d(r) {
        var t = r.args,
          e = r.name,
          n = r.consider_nulls,
          o = void 0 === n ? '' : n,
          s = t ? st(t).join(', ') : '',
          u = (function (r) {
            switch (pr(r)) {
              case 'NTH_VALUE':
              case 'LEAD':
              case 'LAG':
                return !1;
              default:
                return !0;
            }
          })(e);
        return [e, '(', s, !u && ')', o && ' ', o, u && ')']
          .filter(vr)
          .join('');
      }
      function y(r) {
        if (r) {
          var t = r.as_window_specification,
            e = r.expr,
            n = r.keyword,
            o = r.type,
            s = r.parentheses,
            u = pr(o);
          if ('WINDOW' === u) return 'OVER '.concat(p(t));
          if ('ON UPDATE' === u) {
            var a = ''.concat(pr(o), ' ').concat(pr(n)),
              i = st(e) || [];
            return (s && (a = ''.concat(a, '(').concat(i.join(', '), ')')), a);
          }
          throw new Error('unknown over type');
        }
      }
      function w(r) {
        var t = r.arrows,
          e = void 0 === t ? [] : t,
          n = r.collate,
          o = r.target,
          s = r.expr,
          u = r.keyword,
          a = r.symbol,
          i = r.as,
          c = r.tail,
          l = r.properties,
          f = void 0 === l ? [] : l,
          b = o.length,
          p = o.dataType,
          v = o.parentheses,
          d = o.quoted,
          y = o.scale,
          w = o.suffix,
          L = '';
        (null != b && (L = y ? ''.concat(b, ', ').concat(y) : b),
          v && (L = '('.concat(L, ')')),
          w && w.length && (L += ' '.concat(w.join(' '))));
        var C = st(s),
          h = '::',
          m = '';
        return (
          'as' === a &&
            ((C = ''.concat(pr(u), '(').concat(C)),
            (m = ')'),
            (h = ' '.concat(a.toUpperCase(), ' '))),
          (m += e
            .map(function (r, t) {
              return er(r, dr, f[t]);
            })
            .join(' ')),
          c && (m += ' '.concat(c.operator, ' ').concat(st(c.expr))),
          i && (m += ' AS '.concat(fr(i))),
          n && (m += ' '.concat(br(n).join(' '))),
          [
            C,
            h,
            d,
            p,
            d,
            (function (r) {
              if (!r || !r.array) return '';
              switch (r.array) {
                case 'one':
                  return '[]';
                case 'two':
                  return '[][]';
              }
            })(o),
            L,
            m,
          ]
            .filter(vr)
            .join('')
        );
      }
      function L(r) {
        var t = r.args,
          e = r.name,
          n = r.args_parentheses,
          o = r.parentheses,
          s = r.over,
          u = r.collate,
          a = r.suffix,
          i = br(u).join(' '),
          c = y(s),
          l = st(a);
        if (!t) return [e, c].filter(vr).join(' ');
        var f = r.separator || ', ';
        'TRIM' === pr(e) && (f = ' ');
        var b = [e];
        return (
          b.push(!1 === n ? ' ' : '('),
          b.push(st(t).join(f)),
          !1 !== n && b.push(')'),
          (b = [b.join(''), l].filter(vr).join(' ')),
          [o ? '('.concat(b, ')') : b, i, c].filter(vr).join(' ')
        );
      }
      function C(r) {
        var t = r.operator || r.op,
          e = st(r.right),
          n = !1;
        if (Array.isArray(e)) {
          switch (t) {
            case '=':
              t = 'IN';
              break;
            case '!=':
              t = 'NOT IN';
              break;
            case 'BETWEEN':
            case 'NOT BETWEEN':
              ((n = !0), (e = ''.concat(e[0], ' AND ').concat(e[1])));
          }
          n || (e = '('.concat(e.join(', '), ')'));
        }
        var o = r.right.escape || {},
          s = [st(r.left), t, e, pr(o.type), st(o.value)].filter(vr).join(' ');
        return r.parentheses ? '('.concat(s, ')') : s;
      }
      function h(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return m(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          (function (r, t) {
            if (!r) return;
            if ('string' == typeof r) return m(r, t);
            var e = Object.prototype.toString.call(r).slice(8, -1);
            'Object' === e && r.constructor && (e = r.constructor.name);
            if ('Map' === e || 'Set' === e) return Array.from(r);
            if (
              'Arguments' === e ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
            )
              return m(r, t);
          })(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function m(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function E(r) {
        return r ? [pr(r.prefix), st(r.value), pr(r.suffix)] : [];
      }
      function A(r) {
        return r
          ? r.fetch
            ? ((e = (t = r).fetch),
              (n = t.offset),
              []
                .concat(h(E(n)), h(E(e)))
                .filter(vr)
                .join(' '))
            : (function (r) {
                var t = r.seperator,
                  e = r.value;
                return 1 === e.length && 'offset' === t
                  ? nr('OFFSET', st(e[0]))
                  : nr(
                      'LIMIT',
                      e
                        .map(st)
                        .join(
                          ''
                            .concat('offset' === t ? ' ' : '')
                            .concat(pr(t), ' ')
                        )
                    );
              })(r)
          : '';
        var t, e, n;
      }
      function T(r) {
        if (r && 0 !== r.length) {
          var t = r[0].recursive ? 'RECURSIVE ' : '',
            e = r
              .map(function (r) {
                var t = r.name,
                  e = r.stmt,
                  n = r.columns,
                  o = Array.isArray(n)
                    ? '('.concat(n.map(W).join(', '), ')')
                    : '';
                return ''
                  .concat('default' === t.type ? fr(t.value) : dr(t))
                  .concat(o, ' AS (')
                  .concat(st(e), ')');
              })
              .join(', ');
          return 'WITH '.concat(t).concat(e);
        }
      }
      function I(r) {
        if (r && r.position) {
          var t = r.keyword,
            e = r.expr,
            n = [],
            o = pr(t);
          switch (o) {
            case 'VAR':
              n.push(e.map(ot).join(', '));
              break;
            default:
              n.push(o, 'string' == typeof e ? fr(e) : st(e));
          }
          return n.filter(vr).join(' ');
        }
      }
      function _(r) {
        var t = r.as_struct_val,
          e = r.columns,
          n = r.distinct,
          o = r.for,
          s = r.from,
          u = r.for_sys_time_as_of,
          a = void 0 === u ? {} : u,
          i = r.locking_read,
          c = r.groupby,
          l = r.having,
          f = r.into,
          b = void 0 === f ? {} : f,
          p = r.limit,
          v = r.options,
          d = r.orderby,
          y = r.parentheses_symbol,
          w = r.qualify,
          L = r.top,
          C = r.window,
          h = r.with,
          m = r.where,
          E = [T(h), 'SELECT', pr(t)];
        (E.push(cr(L)),
          Array.isArray(v) && E.push(v.join(' ')),
          E.push(
            (function (r) {
              if (r) {
                if ('string' == typeof r) return r;
                var t = r.type,
                  e = r.columns,
                  n = [pr(t)];
                return (
                  e && n.push('('.concat(e.map(W).join(', '), ')')),
                  n.filter(vr).join(' ')
                );
              }
            })(n),
            z(e, s)
          ));
        var _ = b.position,
          S = '';
        (_ && (S = er('INTO', I, b)),
          'column' === _ && E.push(S),
          E.push(er('FROM', $, s)),
          'from' === _ && E.push(S));
        var N = a || {},
          g = N.keyword,
          R = N.expr;
        (E.push(er(g, st, R)),
          E.push(er('WHERE', st, m)),
          E.push(nr('GROUP BY', ut(c).join(', '))),
          E.push(er('HAVING', st, l)),
          E.push(er('QUALIFY', st, w)),
          E.push(er('WINDOW', st, C)),
          E.push(at(d, 'order by')),
          E.push(A(p)),
          E.push(pr(i)),
          'end' === _ && E.push(S),
          E.push(
            (function (r) {
              if (r) {
                var t = r.expr,
                  e = r.keyword,
                  n = [pr(r.type), pr(e)];
                return t
                  ? ''.concat(n.join(' '), '(').concat(st(t), ')')
                  : n.join(' ');
              }
            })(o)
          ));
        var O = E.filter(vr).join(' ');
        return y ? '('.concat(O, ')') : O;
      }
      function S(r, t) {
        var e =
          ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
          r['@@iterator'];
        if (!e) {
          if (
            Array.isArray(r) ||
            (e = (function (r, t) {
              if (!r) return;
              if ('string' == typeof r) return N(r, t);
              var e = Object.prototype.toString.call(r).slice(8, -1);
              'Object' === e && r.constructor && (e = r.constructor.name);
              if ('Map' === e || 'Set' === e) return Array.from(r);
              if (
                'Arguments' === e ||
                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
              )
                return N(r, t);
            })(r)) ||
            (t && r && 'number' == typeof r.length)
          ) {
            e && (r = e);
            var n = 0,
              o = function () {};
            return {
              s: o,
              n: function () {
                return n >= r.length
                  ? { done: !0 }
                  : { done: !1, value: r[n++] };
              },
              e: function (r) {
                throw r;
              },
              f: o,
            };
          }
          throw new TypeError(
            'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
          );
        }
        var s,
          u = !0,
          a = !1;
        return {
          s: function () {
            e = e.call(r);
          },
          n: function () {
            var r = e.next();
            return ((u = r.done), r);
          },
          e: function (r) {
            ((a = !0), (s = r));
          },
          f: function () {
            try {
              u || null == e.return || e.return();
            } finally {
              if (a) throw s;
            }
          },
        };
      }
      function N(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function g(r) {
        if (!r || 0 === r.length) return '';
        var t,
          e = [],
          n = S(r);
        try {
          for (n.s(); !(t = n.n()).done; ) {
            var o = t.value,
              s = o.table,
              u = o.column,
              a = o.value,
              i = [
                [s, u]
                  .filter(vr)
                  .map(function (r) {
                    return fr(r);
                  })
                  .join('.'),
              ],
              c = '';
            (a && ((c = st(a)), i.push('=', c)),
              e.push(i.filter(vr).join(' ')));
          }
        } catch (r) {
          n.e(r);
        } finally {
          n.f();
        }
        return e.join(', ');
      }
      function R(r) {
        if ('select' === r.type) return _(r);
        var t = r.map(st);
        return '('.concat(t.join('), ('), ')');
      }
      function O(r) {
        if (!r) return '';
        var t = ['PARTITION', '('];
        if (Array.isArray(r)) t.push(r.map(fr).join(', '));
        else {
          var e = r.value;
          t.push(e.map(st).join(', '));
        }
        return (t.push(')'), t.filter(vr).join(''));
      }
      function x(r) {
        if (!r) return '';
        switch (r.type) {
          case 'column':
            return '('.concat(r.expr.map(W).join(', '), ')');
        }
      }
      function j(r) {
        var t = r.expr,
          e = r.keyword,
          n = t.type,
          o = [pr(e)];
        switch (n) {
          case 'origin':
            o.push(dr(t));
            break;
          case 'update':
            o.push('UPDATE', er('SET', g, t.set), er('WHERE', st, t.where));
        }
        return o.filter(vr).join(' ');
      }
      function k(r) {
        if (!r) return '';
        var t = r.action;
        return [x(r.target), j(t)].filter(vr).join(' ');
      }
      function U(r) {
        var t = r.table,
          e = r.type,
          n = r.prefix,
          o = void 0 === n ? 'into' : n,
          s = r.columns,
          u = r.conflict,
          a = r.values,
          i = r.where,
          c = r.on_duplicate_update,
          l = r.partition,
          f = r.returning,
          b = r.set,
          p = c || {},
          v = p.keyword,
          d = p.set,
          y = [pr(e), pr(o), $(t), O(l)];
        return (
          Array.isArray(s) && y.push('('.concat(s.map(fr).join(', '), ')')),
          y.push(er(Array.isArray(a) ? 'VALUES' : '', R, a)),
          y.push(er('ON CONFLICT', k, u)),
          y.push(er('SET', g, b)),
          y.push(er('WHERE', st, i)),
          y.push(Er(f)),
          y.push(er(v, g, d)),
          y.filter(vr).join(' ')
        );
      }
      function M(r) {
        var t = r.expr,
          e = r.unit;
        return ['INTERVAL', st(t), pr(e)].filter(vr).join(' ');
      }
      function D(r) {
        var t = r.type,
          e = r.as,
          n = r.expr,
          o = r.with_offset;
        return [
          ''.concat(pr(t), '(').concat((n && st(n)) || '', ')'),
          er('AS', fr, e),
          er(pr(o && o.keyword), fr, o && o.as),
        ]
          .filter(vr)
          .join(' ');
      }
      function P(r) {
        if (r)
          switch (r.type) {
            case 'pivot':
            case 'unpivot':
              return (function (r) {
                var t = r.as,
                  e = r.column,
                  n = r.expr,
                  o = r.in_expr,
                  s = r.type,
                  u = [st(n), 'FOR', W(e), C(o)],
                  a = [''.concat(pr(s), '(').concat(u.join(' '), ')')];
                return (t && a.push('AS', fr(t)), a.join(' '));
              })(r);
            default:
              return '';
          }
      }
      function G(r) {
        if (r) {
          var t = r.keyword,
            e = r.expr,
            n = r.index,
            o = r.index_columns,
            s = r.parentheses,
            u = r.prefix,
            a = [];
          switch (t.toLowerCase()) {
            case 'forceseek':
              a.push(
                pr(t),
                '('.concat(fr(n)),
                '('.concat(o.map(st).filter(vr).join(', '), '))')
              );
              break;
            case 'spatial_window_max_cells':
              a.push(pr(t), '=', st(e));
              break;
            case 'index':
              a.push(
                pr(u),
                pr(t),
                s ? '('.concat(e.map(fr).join(', '), ')') : '= '.concat(fr(e))
              );
              break;
            default:
              a.push(st(e));
          }
          return a.filter(vr).join(' ');
        }
      }
      function F(r) {
        if ('UNNEST' === pr(r.type)) return D(r);
        var t = r.table,
          e = r.db,
          n = r.as,
          o = r.expr,
          s = r.operator,
          u = r.prefix,
          a = r.schema,
          i = r.server,
          c = r.tablesample,
          l = r.table_hint,
          f = fr(i),
          b = fr(e),
          p = fr(a),
          v = t && fr(t);
        if (o)
          switch (o.type) {
            case 'values':
              var d = o.parentheses,
                y = o.values,
                w = o.prefix,
                L = [d && '(', '', d && ')'],
                C = R(y);
              (w &&
                (C = C.split('(')
                  .slice(1)
                  .map(function (r) {
                    return ''.concat(pr(w), '(').concat(r);
                  })
                  .join('')),
                (L[1] = 'VALUES '.concat(C)),
                (v = L.filter(vr).join('')));
              break;
            case 'tumble':
              v = (function (r) {
                if (!r) return '';
                var t = r.data,
                  e = r.timecol,
                  n = r.size;
                return [
                  'TABLE(TUMBLE(TABLE',
                  [fr(t.db), fr(t.table)].filter(vr).join('.'),
                  'DESCRIPTOR('.concat(W(e), ')'),
                  ''.concat(M(n), '))'),
                ]
                  .filter(vr)
                  .join(' ');
              })(o);
              break;
            default:
              v = st(o);
          }
        var h = [f, b, p, (v = [pr(u), v].filter(vr).join(' '))]
          .filter(vr)
          .join('.');
        r.parentheses && (h = '('.concat(h, ')'));
        var m = [h];
        if (c) {
          var E = ['TABLESAMPLE', st(c.expr), dr(c.repeatable)]
            .filter(vr)
            .join(' ');
          m.push(E);
        }
        return (
          m.push(er('AS', fr, n), P(s)),
          l &&
            m.push(
              pr(l.keyword),
              '('.concat(l.expr.map(G).filter(vr).join(', '), ')')
            ),
          m.filter(vr).join(' ')
        );
      }
      function $(r) {
        if (!r) return '';
        if (!Array.isArray(r)) {
          var t = r.expr,
            e = r.parentheses,
            n = $(t);
          return e ? '('.concat(n, ')') : n;
        }
        var o = r[0],
          s = [];
        if ('dual' === o.type) return 'DUAL';
        s.push(F(o));
        for (var u = 1; u < r.length; ++u) {
          var a = r[u],
            i = a.on,
            c = a.using,
            l = a.join,
            f = [];
          (f.push(l ? ' '.concat(pr(l)) : ','),
            f.push(F(a)),
            f.push(er('ON', st, i)),
            c && f.push('USING ('.concat(c.map(fr).join(', '), ')')),
            s.push(f.filter(vr).join(' ')));
        }
        return s.filter(vr).join('');
      }
      function H(r) {
        var t = r.keyword,
          e = r.symbol,
          n = r.value,
          o = [t.toUpperCase()];
        e && o.push(e);
        var s = n;
        switch (t) {
          case 'partition by':
          case 'default collate':
            s = st(n);
            break;
          case 'options':
            s = '('.concat(
              n
                .map(function (r) {
                  return [r.keyword, r.symbol, st(r.value)].join(' ');
                })
                .join(', '),
              ')'
            );
            break;
          case 'cluster by':
            s = n.map(st).join(', ');
        }
        return (o.push(s), o.join(' '));
      }
      function Y(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return B(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          (function (r, t) {
            if (!r) return;
            if ('string' == typeof r) return B(r, t);
            var e = Object.prototype.toString.call(r).slice(8, -1);
            'Object' === e && r.constructor && (e = r.constructor.name);
            if ('Map' === e || 'Set' === e) return Array.from(r);
            if (
              'Arguments' === e ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
            )
              return B(r, t);
          })(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function B(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function W(r) {
        var t = r.array_index,
          e = r.arrows,
          n = void 0 === e ? [] : e,
          o = r.as,
          s = r.collate,
          u = r.column,
          a = r.db,
          i = r.isDual,
          c = r.schema,
          l = r.table,
          f = r.parentheses,
          b = r.properties,
          p = r.suffix,
          v = r.order_by,
          d = r.subFields,
          y = void 0 === d ? [] : d,
          w =
            '*' === u
              ? '*'
              : (function (r, t) {
                  if ('string' == typeof r) return fr(r, t);
                  var e = r.expr,
                    n = r.offset,
                    o = r.suffix;
                  return [st(e), n, o].filter(vr).join('');
                })(u, i),
          L = [c, a, l]
            .filter(vr)
            .map(function (r) {
              return ''.concat(fr(r));
            })
            .join('.');
        (L && (w = ''.concat(L, '.').concat(w)),
          t &&
            ((w = ''.concat(w, '[').concat(dr(t.index), ']')),
            t.property && (w = ''.concat(w, '.').concat(dr(t.property)))));
        var C = [
          (w = [w].concat(Y(y)).join('.')),
          er('AS', st, o),
          n
            .map(function (r, t) {
              return er(r, dr, b[t]);
            })
            .join(' '),
        ];
        (s && C.push(br(s).join(' ')), C.push(pr(p)), C.push(pr(v)));
        var h = C.filter(vr).join(' ');
        return f ? '('.concat(h, ')') : h;
      }
      function V(r) {
        var t = r || {},
          e = t.dataType,
          n = t.length,
          o = t.suffix,
          s = t.scale,
          u = t.expr,
          a = e;
        return (
          null != n &&
            (a += '('.concat(
              [n, s]
                .filter(function (r) {
                  return null != r;
                })
                .join(', '),
              ')'
            )),
          o && o.length && (a += ' '.concat(o.join(' '))),
          u && (a += st(u)),
          a
        );
      }
      function q(r) {
        var t = [];
        if (!r) return t;
        var e = r.definition,
          n = r.keyword,
          o = r.match,
          s = r.table,
          u = r.on_action;
        return (
          t.push(pr(n)),
          t.push($(s)),
          t.push(
            e &&
              '('.concat(
                e
                  .map(function (r) {
                    return st(r);
                  })
                  .join(', '),
                ')'
              )
          ),
          t.push(pr(o)),
          u.map(function (r) {
            return t.push(pr(r.type), st(r.value));
          }),
          t.filter(vr)
        );
      }
      function X(r) {
        var t = r.column,
          e = r.collate,
          n = r.nulls,
          o = r.opclass,
          s = r.order_by;
        return [
          st(
            'string' == typeof t
              ? { type: 'column_ref', table: r.table, column: t }
              : r
          ),
          er(e && e.type, fr, e && e.value),
          o,
          pr(s),
          pr(n),
        ]
          .filter(vr)
          .join(' ');
      }
      function K(r) {
        var t = [],
          e = W(r.column),
          n = V(r.definition);
        (t.push(e), t.push(n));
        var o = (function (r) {
          var t = [],
            e = r.nullable,
            n = r.character_set,
            o = r.check,
            s = r.comment,
            u = r.collate,
            a = r.storage,
            i = r.default_val,
            c = r.auto_increment,
            l = r.unique,
            f = r.primary_key,
            p = r.column_format,
            v = r.reference_definition;
          if ((t.push(pr(e && e.value)), i)) {
            var d = i.type,
              y = i.value;
            t.push(d.toUpperCase(), st(y));
          }
          var w = ar().database;
          return (
            t.push(b(o)),
            t.push(Tr(c), pr(f), pr(l), hr(s)),
            t.push.apply(t, Y(br(n))),
            'sqlite' !== w && t.push.apply(t, Y(br(u))),
            t.push.apply(t, Y(br(p))),
            t.push.apply(t, Y(br(a))),
            t.push.apply(t, Y(q(v))),
            t.filter(vr).join(' ')
          );
        })(r);
        t.push(o);
        var s = (function (r) {
          if (r)
            return [
              pr(r.value),
              '('.concat(st(r.expr), ')'),
              pr(r.storage_type),
            ]
              .filter(vr)
              .join(' ');
        })(r.generated);
        return (t.push(s), t.filter(vr).join(' '));
      }
      function Q(r) {
        return r
          ? ['AS', /^(`?)[a-z_][0-9a-z_]*(`?)$/i.test(r) ? fr(r) : lr(r)].join(
              ' '
            )
          : '';
      }
      function Z(r, t) {
        var e = r.expr;
        if ('cast' === r.type) return w(r);
        t && (e.isDual = t);
        var n = st(e);
        return (
          e.parentheses &&
            Reflect.has(e, 'array_index') &&
            (n = '('.concat(n, ')')),
          e.array_index &&
            'column_ref' !== e.type &&
            (n = ''.concat(n, '[').concat(dr(e.array_index.index), ']')),
          [n, Q(r.as)].filter(vr).join(' ')
        );
      }
      function z(r, t) {
        if (!r || '*' === r) return r;
        var e = (function (r) {
            var t = Array.isArray(r) && r[0];
            return !(!t || 'dual' !== t.type);
          })(t),
          n = [],
          o = r.expr_list,
          s = r.star,
          u = r.type;
        n.push(s, pr(u));
        var a = (o || r)
          .map(function (r) {
            return Z(r, e);
          })
          .join(', ');
        return (
          n.push([u && '(', a, u && ')'].filter(vr).join('')),
          n.filter(vr).join(' ')
        );
      }
      function J(r) {
        return (J =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      (e.r(n),
        e.d(n, 'arrayStructTypeToSQL', function () {
          return Cr;
        }),
        e.d(n, 'autoIncrementToSQL', function () {
          return Tr;
        }),
        e.d(n, 'columnOrderListToSQL', function () {
          return Ir;
        }),
        e.d(n, 'commonKeywordArgsToSQL', function () {
          return Ar;
        }),
        e.d(n, 'commonOptionConnector', function () {
          return er;
        }),
        e.d(n, 'connector', function () {
          return nr;
        }),
        e.d(n, 'commonTypeValue', function () {
          return br;
        }),
        e.d(n, 'commentToSQL', function () {
          return hr;
        }),
        e.d(n, 'createBinaryExpr', function () {
          return sr;
        }),
        e.d(n, 'createValueExpr', function () {
          return or;
        }),
        e.d(n, 'dataTypeToSQL', function () {
          return Lr;
        }),
        e.d(n, 'DEFAULT_OPT', function () {
          return rr;
        }),
        e.d(n, 'escape', function () {
          return ur;
        }),
        e.d(n, 'literalToSQL', function () {
          return dr;
        }),
        e.d(n, 'columnIdentifierToSql', function () {
          return lr;
        }),
        e.d(n, 'getParserOpt', function () {
          return ar;
        }),
        e.d(n, 'identifierToSql', function () {
          return fr;
        }),
        e.d(n, 'onPartitionsToSQL', function () {
          return wr;
        }),
        e.d(n, 'replaceParams', function () {
          return yr;
        }),
        e.d(n, 'returningToSQL', function () {
          return Er;
        }),
        e.d(n, 'hasVal', function () {
          return vr;
        }),
        e.d(n, 'setParserOpt', function () {
          return ir;
        }),
        e.d(n, 'toUpper', function () {
          return pr;
        }),
        e.d(n, 'topToSQL', function () {
          return cr;
        }),
        e.d(n, 'triggerEventToSQL', function () {
          return mr;
        }));
      var rr = { database: 'mysql', type: 'table' },
        tr = rr;
      function er(r, t, e) {
        if (e) return r ? ''.concat(r.toUpperCase(), ' ').concat(t(e)) : t(e);
      }
      function nr(r, t) {
        if (t) return ''.concat(r.toUpperCase(), ' ').concat(t);
      }
      function or(r) {
        var t = J(r);
        if (Array.isArray(r)) return { type: 'expr_list', value: r.map(or) };
        if (null === r) return { type: 'null', value: null };
        switch (t) {
          case 'boolean':
            return { type: 'bool', value: r };
          case 'string':
            return { type: 'string', value: r };
          case 'number':
            return { type: 'number', value: r };
          default:
            throw new Error('Cannot convert value "'.concat(t, '" to SQL'));
        }
      }
      function sr(r, t, e) {
        var n = { operator: r, type: 'binary_expr' };
        return (
          (n.left = t.type ? t : or(t)),
          'BETWEEN' === r || 'NOT BETWEEN' === r
            ? ((n.right = { type: 'expr_list', value: [or(e[0]), or(e[1])] }),
              n)
            : ((n.right = e.type ? e : or(e)), n)
        );
      }
      function ur(r) {
        return r;
      }
      function ar() {
        return tr;
      }
      function ir(r) {
        tr = r;
      }
      function cr(r) {
        if (r) {
          var t = r.value,
            e = r.percent,
            n = r.parentheses ? '('.concat(t, ')') : t,
            o = 'TOP '.concat(n);
          return e ? ''.concat(o, ' ').concat(e.toUpperCase()) : o;
        }
      }
      function lr(r) {
        var t = ar().database;
        if (r)
          switch (t && t.toLowerCase()) {
            case 'postgresql':
            case 'db2':
            case 'snowflake':
              return '"'.concat(r, '"');
            case 'transactsql':
              return '['.concat(r, ']');
            case 'mysql':
            case 'mariadb':
            case 'bigquery':
            default:
              return '`'.concat(r, '`');
          }
      }
      function fr(r, t) {
        var e = ar().database;
        if (!0 === t) return "'".concat(r, "'");
        if (r) {
          if ('*' === r) return r;
          switch (e && e.toLowerCase()) {
            case 'mysql':
            case 'mariadb':
            case 'sqlite':
              return '`'.concat(r, '`');
            case 'postgresql':
            case 'snowflake':
              return '"'.concat(r, '"');
            case 'transactsql':
              return '['.concat(r, ']');
            case 'bigquery':
            case 'db2':
              return r;
            default:
              return '`'.concat(r, '`');
          }
        }
      }
      function br(r) {
        var t = [];
        if (!r) return t;
        var e = r.type,
          n = r.symbol,
          o = r.value;
        return (
          t.push(e.toUpperCase()),
          n && t.push(n),
          t.push(o.toUpperCase()),
          t
        );
      }
      function pr(r) {
        if (r) return r.toUpperCase();
      }
      function vr(r) {
        return r;
      }
      function dr(r) {
        if (r) {
          var t = r.prefix,
            e = r.type,
            n = r.parentheses,
            o = r.suffix,
            s = r.value,
            u = 'string' == typeof r ? r : s;
          switch (e) {
            case 'backticks_quote_string':
              u = '`'.concat(s, '`');
              break;
            case 'string':
              u = "'".concat(s, "'");
              break;
            case 'regex_string':
              u = 'r"'.concat(s, '"');
              break;
            case 'hex_string':
              u = "X'".concat(s, "'");
              break;
            case 'full_hex_string':
              u = '0x'.concat(s);
              break;
            case 'natural_string':
              u = "N'".concat(s, "'");
              break;
            case 'bit_string':
              u = "b'".concat(s, "'");
              break;
            case 'double_quote_string':
              u = '"'.concat(s, '"');
              break;
            case 'single_quote_string':
              u = "'".concat(s, "'");
              break;
            case 'boolean':
            case 'bool':
              u = s ? 'TRUE' : 'FALSE';
              break;
            case 'null':
              u = 'NULL';
              break;
            case 'star':
              u = '*';
              break;
            case 'param':
              ((u = ''.concat(t || ':').concat(s)), (t = null));
              break;
            case 'origin':
              u = s.toUpperCase();
              break;
            case 'date':
            case 'datetime':
            case 'time':
            case 'timestamp':
              u = ''.concat(e.toUpperCase(), " '").concat(s, "'");
              break;
            case 'var_string':
              u = "N'".concat(s, "'");
          }
          var a = [];
          return (
            t && a.push(pr(t)),
            a.push(u),
            o &&
              a.push(
                'object' === J(o) && o.collate ? br(o.collate).join(' ') : pr(o)
              ),
            (u = a.join(' ')),
            n ? '('.concat(u, ')') : u
          );
        }
      }
      function yr(r, t) {
        return (function r(t, e) {
          return (
            Object.keys(t)
              .filter(function (r) {
                var e = t[r];
                return Array.isArray(e) || ('object' === J(e) && null !== e);
              })
              .forEach(function (n) {
                var o = t[n];
                if ('object' !== J(o) || 'param' !== o.type) return r(o, e);
                if (void 0 === e[o.value])
                  throw new Error(
                    'no value for parameter :'.concat(o.value, ' found')
                  );
                return ((t[n] = or(e[o.value])), null);
              }),
            t
          );
        })(JSON.parse(JSON.stringify(r)), t);
      }
      function wr(r) {
        var t = r.type,
          e = r.partitions;
        return [
          pr(t),
          '('.concat(
            e
              .map(function (r) {
                if ('range' !== r.type) return dr(r);
                var t = r.start,
                  e = r.end,
                  n = r.symbol;
                return ''.concat(dr(t), ' ').concat(pr(n), ' ').concat(dr(e));
              })
              .join(', '),
            ')'
          ),
        ].join(' ');
      }
      function Lr(r) {
        var t = r.dataType,
          e = r.length,
          n = r.parentheses,
          o = r.scale,
          s = r.suffix,
          u = '';
        return (
          null != e && (u = o ? ''.concat(e, ', ').concat(o) : e),
          n && (u = '('.concat(u, ')')),
          s && s.length && (u += ' '.concat(s.join(' '))),
          ''.concat(t).concat(u)
        );
      }
      function Cr(r) {
        if (r) {
          var t = r.dataType,
            e = r.definition,
            n = r.anglebracket,
            o = pr(t);
          if ('ARRAY' !== o && 'STRUCT' !== o) return o;
          var s =
            e &&
            e
              .map(function (r) {
                return [r.field_name, Cr(r.field_type)].filter(vr).join(' ');
              })
              .join(', ');
          return n
            ? ''.concat(o, '<').concat(s, '>')
            : ''.concat(o, ' ').concat(s);
        }
      }
      function hr(r) {
        if (r) {
          var t = [],
            e = r.keyword,
            n = r.symbol,
            o = r.value;
          return (
            t.push(e.toUpperCase()),
            n && t.push(n),
            t.push(dr(o)),
            t.join(' ')
          );
        }
      }
      function mr(r) {
        return r
          .map(function (r) {
            var t = r.keyword,
              e = r.args,
              n = [pr(t)];
            if (e) {
              var o = e.keyword,
                s = e.columns;
              n.push(pr(o), s.map(W).join(', '));
            }
            return n.join(' ');
          })
          .join(' OR ');
      }
      function Er(r) {
        return r
          ? ['RETURNING', r.columns.map(Z).filter(vr).join(', ')].join(' ')
          : '';
      }
      function Ar(r) {
        return r ? [pr(r.keyword), pr(r.args)] : [];
      }
      function Tr(r) {
        if (r) {
          if ('string' == typeof r) {
            var t = ar().database;
            switch (t && t.toLowerCase()) {
              case 'sqlite':
                return 'AUTOINCREMENT';
              default:
                return 'AUTO_INCREMENT';
            }
          }
          var e = r.keyword,
            n = r.seed,
            o = r.increment,
            s = r.parentheses,
            u = pr(e);
          return (s && (u += '('.concat(dr(n), ', ').concat(dr(o), ')')), u);
        }
      }
      function Ir(r) {
        if (r) return r.map(X).filter(vr).join(', ');
      }
      var _r = [
        'analyze',
        'attach',
        'select',
        'deallocate',
        'delete',
        'exec',
        'update',
        'insert',
        'drop',
        'rename',
        'truncate',
        'call',
        'desc',
        'use',
        'alter',
        'set',
        'create',
        'lock',
        'unlock',
        'declare',
        'show',
        'replace',
        'if',
        'grant',
        'revoke',
        'proc',
        'raise',
        'execute',
      ];
      function Sr(r) {
        var t = r && r.ast ? r.ast : r;
        if (!_r.includes(t.type))
          throw new Error(
            ''.concat(t.type, ' statements not supported at the moment')
          );
      }
      function Nr(r) {
        return Array.isArray(r) ? (r.forEach(Sr), Yr(r)) : (Sr(r), Hr(r));
      }
      function gr(r) {
        return 'go' === r.go
          ? (function r(t) {
              if (!t || 0 === t.length) return '';
              var e = [Nr(t.ast)];
              return (
                t.go_next && e.push(t.go.toUpperCase(), r(t.go_next)),
                e
                  .filter(function (r) {
                    return r;
                  })
                  .join(' ')
              );
            })(r)
          : Nr(r);
      }
      function Rr(r, t) {
        var e =
          ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
          r['@@iterator'];
        if (!e) {
          if (
            Array.isArray(r) ||
            (e = xr(r)) ||
            (t && r && 'number' == typeof r.length)
          ) {
            e && (r = e);
            var n = 0,
              o = function () {};
            return {
              s: o,
              n: function () {
                return n >= r.length
                  ? { done: !0 }
                  : { done: !1, value: r[n++] };
              },
              e: function (r) {
                throw r;
              },
              f: o,
            };
          }
          throw new TypeError(
            'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
          );
        }
        var s,
          u = !0,
          a = !1;
        return {
          s: function () {
            e = e.call(r);
          },
          n: function () {
            var r = e.next();
            return ((u = r.done), r);
          },
          e: function (r) {
            ((a = !0), (s = r));
          },
          f: function () {
            try {
              u || null == e.return || e.return();
            } finally {
              if (a) throw s;
            }
          },
        };
      }
      function Or(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return jr(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          xr(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function xr(r, t) {
        if (r) {
          if ('string' == typeof r) return jr(r, t);
          var e = Object.prototype.toString.call(r).slice(8, -1);
          return (
            'Object' === e && r.constructor && (e = r.constructor.name),
            'Map' === e || 'Set' === e
              ? Array.from(r)
              : 'Arguments' === e ||
                  /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
                ? jr(r, t)
                : void 0
          );
        }
      }
      function jr(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function kr(r) {
        var t = r.type,
          e = r.keyword,
          n = r.name,
          o = r.prefix,
          s = [pr(t), pr(e), pr(o)];
        switch (e) {
          case 'table':
            s.push($(n));
            break;
          case 'trigger':
            s.push(
              [
                n[0].schema ? ''.concat(fr(n[0].schema), '.') : '',
                fr(n[0].trigger),
              ]
                .filter(vr)
                .join('')
            );
            break;
          case 'database':
          case 'schema':
          case 'procedure':
            s.push(fr(n));
            break;
          case 'view':
            s.push($(n), r.options && r.options.map(st).filter(vr).join(' '));
            break;
          case 'index':
            s.push.apply(
              s,
              [W(n)].concat(Or(r.table ? ['ON', F(r.table)] : []), [
                r.options && r.options.map(st).filter(vr).join(' '),
              ])
            );
        }
        return s.filter(vr).join(' ');
      }
      function Ur(r) {
        var t = r.type,
          e = r.keyword,
          n = r.tables,
          o = [t.toUpperCase(), pr(e)];
        if ('UNLOCK' === t.toUpperCase()) return o.join(' ');
        var s,
          u = [],
          a = Rr(n);
        try {
          var i = function () {
            var r = s.value,
              t = r.table,
              e = r.lock_type,
              n = [F(t)];
            if (e) {
              n.push(
                ['prefix', 'type', 'suffix']
                  .map(function (r) {
                    return pr(e[r]);
                  })
                  .filter(vr)
                  .join(' ')
              );
            }
            u.push(n.join(' '));
          };
          for (a.s(); !(s = a.n()).done; ) i();
        } catch (r) {
          a.e(r);
        } finally {
          a.f();
        }
        return (
          o.push.apply(
            o,
            [u.join(', ')].concat(
              Or(
                (function (r) {
                  var t = r.lock_mode,
                    e = r.nowait,
                    n = [];
                  if (t) {
                    var o = t.mode;
                    n.push(o.toUpperCase());
                  }
                  return (e && n.push(e.toUpperCase()), n);
                })(r)
              )
            )
          ),
          o.filter(vr).join(' ')
        );
      }
      function Mr(r) {
        var t = r.name,
          e = r.host,
          n = [dr(t)];
        return (e && n.push('@', dr(e)), n.join(''));
      }
      function Dr(r) {
        var t = r.type,
          e = r.grant_option_for,
          n = r.keyword,
          o = r.objects,
          s = r.on,
          u = r.to_from,
          a = r.user_or_roles,
          i = r.with,
          c = [pr(t), dr(e)],
          l = o
            .map(function (r) {
              var t = r.priv,
                e = r.columns,
                n = [st(t)];
              return (
                e && n.push('('.concat(e.map(W).join(', '), ')')),
                n.join(' ')
              );
            })
            .join(', ');
        if ((c.push(l), s))
          switch ((c.push('ON'), n)) {
            case 'priv':
              c.push(
                dr(s.object_type),
                s.priv_level
                  .map(function (r) {
                    return [fr(r.prefix), fr(r.name)].filter(vr).join('.');
                  })
                  .join(', ')
              );
              break;
            case 'proxy':
              c.push(Mr(s));
          }
        return (
          c.push(pr(u), a.map(Mr).join(', ')),
          c.push(dr(i)),
          c.filter(vr).join(' ')
        );
      }
      function Pr(r) {
        var t = r.name,
          e = r.value;
        return ['@'.concat(t), '=', st(e)].filter(vr).join(' ');
      }
      function Gr(r) {
        var t = r.left,
          e = r.right,
          n = r.symbol,
          o = r.keyword;
        t.keyword = o;
        var s = st(t),
          u = st(e);
        return ''.concat(s, ' ').concat(n, ' ').concat(u);
      }
      function Fr(r) {
        var t,
          e,
          n,
          o,
          s = r.keyword,
          u = r.suffix,
          a = '';
        switch (pr(s)) {
          case 'BINLOG':
            ((e = (t = r).in),
              (n = t.from),
              (o = t.limit),
              (a = [er('IN', dr, e && e.right), er('FROM', $, n), A(o)]
                .filter(vr)
                .join(' ')));
            break;
          case 'CHARACTER':
          case 'COLLATION':
            a = (function (r) {
              var t = r.expr;
              if (t)
                return 'LIKE' === pr(t.op)
                  ? er('LIKE', dr, t.right)
                  : er('WHERE', st, t);
            })(r);
            break;
          case 'COLUMNS':
          case 'INDEXES':
            a = er('FROM', $, r.from);
            break;
          case 'GRANTS':
            a = (function (r) {
              var t = r.for;
              if (t) {
                var e = t.user,
                  n = t.host,
                  o = t.role_list,
                  s = "'".concat(e, "'");
                return (
                  n && (s += "@'".concat(n, "'")),
                  [
                    'FOR',
                    s,
                    o && 'USING',
                    o &&
                      o
                        .map(function (r) {
                          return "'".concat(r, "'");
                        })
                        .join(', '),
                  ]
                    .filter(vr)
                    .join(' ')
                );
              }
            })(r);
            break;
          case 'CREATE':
            a = er('', F, r[u]);
            break;
          case 'VAR':
            ((a = ot(r.var)), (s = ''));
        }
        return ['SHOW', pr(s), pr(u), a].filter(vr).join(' ');
      }
      var $r = {
        alter: function (r) {
          var t = r.keyword;
          switch (void 0 === t ? 'table' : t) {
            case 'aggregate':
              return (function (r) {
                var t = r.args,
                  e = r.expr,
                  n = r.keyword,
                  o = r.name,
                  s = r.type,
                  u = t.expr,
                  a = t.orderby;
                return [
                  pr(s),
                  pr(n),
                  [
                    [fr(o.schema), fr(o.name)].filter(vr).join('.'),
                    '('
                      .concat(u.map(zr).join(', '))
                      .concat(
                        a
                          ? [' ORDER', 'BY', a.map(zr).join(', ')].join(' ')
                          : '',
                        ')'
                      ),
                  ]
                    .filter(vr)
                    .join(''),
                  Zr(e),
                ]
                  .filter(vr)
                  .join(' ');
              })(r);
            case 'table':
              return (function (r) {
                var t = r.type,
                  e = r.table,
                  n = r.expr,
                  o = void 0 === n ? [] : n,
                  s = pr(t),
                  u = $(e),
                  a = o.map(st);
                return [s, 'TABLE', u, a.join(', ')].filter(vr).join(' ');
              })(r);
            case 'schema':
              return (function (r) {
                var t = r.expr,
                  e = r.keyword,
                  n = r.schema;
                return [pr(r.type), pr(e), fr(n), Zr(t)].filter(vr).join(' ');
              })(r);
            case 'domain':
            case 'type':
              return (function (r) {
                var t = r.expr,
                  e = r.keyword,
                  n = r.name;
                return [
                  pr(r.type),
                  pr(e),
                  [fr(n.schema), fr(n.name)].filter(vr).join('.'),
                  Zr(t),
                ]
                  .filter(vr)
                  .join(' ');
              })(r);
            case 'function':
              return (function (r) {
                var t = r.args,
                  e = r.expr,
                  n = r.keyword,
                  o = r.name;
                return [
                  pr(r.type),
                  pr(n),
                  [
                    [fr(o.schema), fr(o.name)].filter(vr).join('.'),
                    t &&
                      '('.concat(t.expr ? t.expr.map(zr).join(', ') : '', ')'),
                  ]
                    .filter(vr)
                    .join(''),
                  Zr(e),
                ]
                  .filter(vr)
                  .join(' ');
              })(r);
            case 'view':
              return (function (r) {
                var t = r.type,
                  e = r.columns,
                  n = r.attributes,
                  o = r.select,
                  s = r.view,
                  u = r.with,
                  a = pr(t),
                  i = F(s),
                  c = [a, 'VIEW', i];
                e && c.push('('.concat(e.map(W).join(', '), ')'));
                n && c.push('WITH '.concat(n.map(pr).join(', ')));
                (c.push('AS', _(o)), u && c.push(pr(u)));
                return c.filter(vr).join(' ');
              })(r);
          }
        },
        analyze: function (r) {
          var t = r.type,
            e = r.table;
          return [pr(t), F(e)].join(' ');
        },
        attach: function (r) {
          var t = r.type,
            e = r.database,
            n = r.expr,
            o = r.as,
            s = r.schema;
          return [pr(t), pr(e), st(n), pr(o), fr(s)].filter(vr).join(' ');
        },
        create: function (r) {
          var t = r.keyword,
            e = '';
          switch (t.toLowerCase()) {
            case 'aggregate':
              e = (function (r) {
                var t = r.type,
                  e = r.replace,
                  n = r.keyword,
                  o = r.name,
                  s = r.args,
                  u = r.options,
                  a = [pr(t), pr(e), pr(n)],
                  i = [fr(o.schema), o.name].filter(vr).join('.'),
                  c = ''
                    .concat(s.expr.map(zr).join(', '))
                    .concat(
                      s.orderby
                        ? [' ORDER', 'BY', s.orderby.map(zr).join(', ')].join(
                            ' '
                          )
                        : ''
                    );
                return (
                  a.push(
                    ''.concat(i, '(').concat(c, ')'),
                    '('.concat(u.map(Qr).join(', '), ')')
                  ),
                  a.filter(vr).join(' ')
                );
              })(r);
              break;
            case 'table':
              e = (function (r) {
                var t = r.type,
                  e = r.keyword,
                  n = r.table,
                  o = r.like,
                  s = r.as,
                  u = r.temporary,
                  a = r.if_not_exists,
                  i = r.create_definitions,
                  c = r.table_options,
                  l = r.ignore_replace,
                  f = r.or_replace,
                  b = r.query_expr,
                  p = [pr(t), pr(f), pr(u), pr(e), pr(a), $(n)];
                if (o) {
                  var v = o.type,
                    d = $(o.table);
                  return (p.push(pr(v), d), p.filter(vr).join(' '));
                }
                i && p.push('('.concat(i.map(qr).join(', '), ')'));
                c && p.push(c.map(H).join(' '));
                (p.push(pr(l), pr(s)), b && p.push(Hr(b)));
                return p.filter(vr).join(' ');
              })(r);
              break;
            case 'trigger':
              e =
                'constraint' === r.resource
                  ? (function (r) {
                      var t = r.constraint,
                        e = r.constraint_kw,
                        n = r.deferrable,
                        o = r.events,
                        s = r.execute,
                        u = r.for_each,
                        a = r.from,
                        i = r.location,
                        c = r.keyword,
                        l = r.or,
                        f = r.type,
                        b = r.table,
                        p = r.when,
                        v = [pr(f), pr(l), pr(e), pr(c), fr(t), pr(i)],
                        d = mr(o);
                      (v.push(d, 'ON', F(b)), a && v.push('FROM', F(a)));
                      (v.push.apply(v, Br(Ar(n)).concat(Br(Ar(u)))),
                        p && v.push(pr(p.type), st(p.cond)));
                      return (
                        v.push(pr(s.keyword), L(s.expr)),
                        v.filter(vr).join(' ')
                      );
                    })(r)
                  : (function (r) {
                      var t = r.definer,
                        e = r.for_each,
                        n = r.keyword,
                        o = r.execute,
                        s = r.type,
                        u = r.table,
                        a = r.if_not_exists,
                        i = r.temporary,
                        c = r.trigger,
                        l = r.events,
                        f = r.order,
                        b = r.time,
                        p = r.when,
                        v = [
                          pr(s),
                          pr(i),
                          t,
                          pr(n),
                          pr(a),
                          F(c),
                          pr(b),
                          l.map(function (r) {
                            var t = [pr(r.keyword)],
                              e = r.args;
                            return (
                              e &&
                                t.push(
                                  pr(e.keyword),
                                  e.columns.map(W).join(', ')
                                ),
                              t.join(' ')
                            );
                          }),
                          'ON',
                          F(u),
                          pr(e && e.keyword),
                          pr(e && e.args),
                          f &&
                            ''.concat(pr(f.keyword), ' ').concat(fr(f.trigger)),
                          er('WHEN', st, p),
                          pr(o.prefix),
                        ];
                      switch (o.type) {
                        case 'set':
                          v.push(er('SET', g, o.expr));
                          break;
                        case 'multiple':
                          v.push(Yr(o.expr.ast));
                      }
                      return (v.push(pr(o.suffix)), v.filter(vr).join(' '));
                    })(r);
              break;
            case 'extension':
              e = (function (r) {
                var t = r.extension,
                  e = r.from,
                  n = r.if_not_exists,
                  o = r.keyword,
                  s = r.schema,
                  u = r.type,
                  a = r.with,
                  i = r.version;
                return [
                  pr(u),
                  pr(o),
                  pr(n),
                  dr(t),
                  pr(a),
                  er('SCHEMA', dr, s),
                  er('VERSION', dr, i),
                  er('FROM', dr, e),
                ]
                  .filter(vr)
                  .join(' ');
              })(r);
              break;
            case 'function':
              e = (function (r) {
                var t = r.type,
                  e = r.replace,
                  n = r.keyword,
                  o = r.name,
                  s = r.args,
                  u = r.returns,
                  a = r.options,
                  i = r.last,
                  c = [pr(t), pr(e), pr(n)],
                  l = [fr(o.schema), o.name].filter(vr).join('.'),
                  f = s.map(zr).filter(vr).join(', ');
                return (
                  c.push(
                    ''.concat(l, '(').concat(f, ')'),
                    (function (r) {
                      var t = r.type,
                        e = r.keyword,
                        n = r.expr;
                      return [
                        pr(t),
                        pr(e),
                        Array.isArray(n)
                          ? '('.concat(n.map(K).join(', '), ')')
                          : Xr(n),
                      ]
                        .filter(vr)
                        .join(' ');
                    })(u),
                    a.map(Kr).join(' '),
                    i
                  ),
                  c.filter(vr).join(' ')
                );
              })(r);
              break;
            case 'index':
              e = (function (r) {
                var t = r.concurrently,
                  e = r.filestream_on,
                  n = r.keyword,
                  o = r.include,
                  s = r.index_columns,
                  a = r.index_type,
                  c = r.index_using,
                  l = r.index,
                  f = r.on,
                  b = r.index_options,
                  p = r.algorithm_option,
                  v = r.lock_option,
                  d = r.on_kw,
                  y = r.table,
                  w = r.tablespace,
                  L = r.type,
                  C = r.where,
                  h = r.with,
                  m = r.with_before_where,
                  E = h && 'WITH ('.concat(i(h).join(', '), ')'),
                  A =
                    o &&
                    ''.concat(pr(o.keyword), ' (').concat(
                      o.columns
                        .map(function (r) {
                          return fr(r);
                        })
                        .join(', '),
                      ')'
                    ),
                  T = [pr(L), pr(a), pr(n), pr(t), fr(l), pr(d), F(y)].concat(
                    Br(u(c)),
                    [
                      '('.concat(Ir(s), ')'),
                      A,
                      i(b).join(' '),
                      Zr(p),
                      Zr(v),
                      er('TABLESPACE', dr, w),
                    ]
                  );
                m
                  ? T.push(E, er('WHERE', st, C))
                  : T.push(er('WHERE', st, C), E);
                return (
                  T.push(er('ON', st, f), er('FILESTREAM_ON', dr, e)),
                  T.filter(vr).join(' ')
                );
              })(r);
              break;
            case 'sequence':
              e = (function (r) {
                var t = r.type,
                  e = r.keyword,
                  n = r.sequence,
                  o = r.temporary,
                  s = r.if_not_exists,
                  u = r.create_definitions,
                  a = [pr(t), pr(o), pr(e), pr(s), $(n)];
                u && a.push(u.map(qr).join(' '));
                return a.filter(vr).join(' ');
              })(r);
              break;
            case 'database':
              e = (function (r) {
                var t = r.type,
                  e = r.keyword,
                  n = r.database,
                  o = r.if_not_exists,
                  s = r.create_definitions,
                  u = [pr(t), pr(e), pr(o), lr(n)];
                s && u.push(s.map(H).join(' '));
                return u.filter(vr).join(' ');
              })(r);
              break;
            case 'view':
              e = (function (r) {
                var t = r.algorithm,
                  e = r.columns,
                  n = r.definer,
                  o = r.keyword,
                  s = r.recursive,
                  u = r.replace,
                  a = r.select,
                  i = r.sql_security,
                  c = r.temporary,
                  l = r.type,
                  f = r.view,
                  b = r.with,
                  p = r.with_options,
                  v = f.db,
                  d = f.view,
                  y = [fr(v), fr(d)].filter(vr).join('.');
                return [
                  pr(l),
                  pr(u),
                  pr(c),
                  pr(s),
                  t && 'ALGORITHM = '.concat(pr(t)),
                  n,
                  i && 'SQL SECURITY '.concat(pr(i)),
                  pr(o),
                  y,
                  e && '('.concat(e.map(lr).join(', '), ')'),
                  p &&
                    [
                      'WITH',
                      '('.concat(
                        p
                          .map(function (r) {
                            return br(r).join(' ');
                          })
                          .join(', '),
                        ')'
                      ),
                    ].join(' '),
                  'AS',
                  Hr(a),
                  pr(b),
                ]
                  .filter(vr)
                  .join(' ');
              })(r);
              break;
            case 'domain':
              e = (function (r) {
                var t = r.as,
                  e = r.domain,
                  n = r.type,
                  o = r.keyword,
                  s = r.target,
                  u = r.create_definitions,
                  a = [
                    pr(n),
                    pr(o),
                    [fr(e.schema), fr(e.name)].filter(vr).join('.'),
                    pr(t),
                    Lr(s),
                  ];
                if (u && u.length > 0) {
                  var i,
                    c = [],
                    l = (function (r, t) {
                      var e =
                        ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
                        r['@@iterator'];
                      if (!e) {
                        if (
                          Array.isArray(r) ||
                          (e = Wr(r)) ||
                          (t && r && 'number' == typeof r.length)
                        ) {
                          e && (r = e);
                          var n = 0,
                            o = function () {};
                          return {
                            s: o,
                            n: function () {
                              return n >= r.length
                                ? { done: !0 }
                                : { done: !1, value: r[n++] };
                            },
                            e: function (r) {
                              throw r;
                            },
                            f: o,
                          };
                        }
                        throw new TypeError(
                          'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
                        );
                      }
                      var s,
                        u = !0,
                        a = !1;
                      return {
                        s: function () {
                          e = e.call(r);
                        },
                        n: function () {
                          var r = e.next();
                          return ((u = r.done), r);
                        },
                        e: function (r) {
                          ((a = !0), (s = r));
                        },
                        f: function () {
                          try {
                            u || null == e.return || e.return();
                          } finally {
                            if (a) throw s;
                          }
                        },
                      };
                    })(u);
                  try {
                    for (l.s(); !(i = l.n()).done; ) {
                      var f = i.value,
                        p = f.type;
                      switch (p) {
                        case 'collate':
                          c.push(br(f).join(' '));
                          break;
                        case 'default':
                          c.push(pr(p), st(f.value));
                          break;
                        case 'constraint':
                          c.push(b(f));
                      }
                    }
                  } catch (r) {
                    l.e(r);
                  } finally {
                    l.f();
                  }
                  a.push(c.filter(vr).join(' '));
                }
                return a.filter(vr).join(' ');
              })(r);
              break;
            case 'type':
              e = (function (r) {
                var t = r.as,
                  e = r.create_definitions,
                  n = r.keyword,
                  o = r.name,
                  s = r.resource,
                  u = [
                    pr(r.type),
                    pr(n),
                    [fr(o.schema), fr(o.name)].filter(vr).join('.'),
                    pr(t),
                    pr(s),
                  ];
                if (e) {
                  var a = [];
                  switch (s) {
                    case 'enum':
                      a.push(st(e));
                  }
                  u.push(a.filter(vr).join(' '));
                }
                return u.filter(vr).join(' ');
              })(r);
              break;
            default:
              throw new Error('unknown create resource '.concat(t));
          }
          return e;
        },
        select: _,
        deallocate: function (r) {
          var t = r.type,
            e = r.keyword,
            n = r.expr;
          return [pr(t), pr(e), st(n)].filter(vr).join(' ');
        },
        delete: function (r) {
          var t = r.columns,
            e = r.from,
            n = r.table,
            o = r.where,
            s = r.orderby,
            u = r.with,
            a = r.limit,
            i = [T(u), 'DELETE'],
            c = z(t, e);
          return (
            i.push(c),
            Array.isArray(n) &&
              ((1 === n.length && !0 === n[0].addition) || i.push($(n))),
            i.push(er('FROM', $, e)),
            i.push(er('WHERE', st, o)),
            i.push(at(s, 'order by')),
            i.push(A(a)),
            i.filter(vr).join(' ')
          );
        },
        exec: function (r) {
          var t = r.keyword,
            e = r.module,
            n = r.parameters;
          return [pr(t), F(e), (n || []).map(Pr).filter(vr).join(', ')]
            .filter(vr)
            .join(' ');
        },
        execute: function (r) {
          var t = r.type,
            e = r.name,
            n = r.args,
            o = [pr(t)],
            s = [e];
          return (
            n && s.push('('.concat(st(n).join(', '), ')')),
            o.push(s.join('')),
            o.filter(vr).join(' ')
          );
        },
        for: function (r) {
          var t = r.type,
            e = r.label,
            n = r.target,
            o = r.query,
            s = r.stmts;
          return [e, pr(t), n, 'IN', Yr([o]), 'LOOP', Yr(s), 'END LOOP', e]
            .filter(vr)
            .join(' ');
        },
        update: function (r) {
          var t = r.from,
            e = r.table,
            n = r.set,
            o = r.where,
            s = r.orderby,
            u = r.with,
            a = r.limit,
            i = r.returning;
          return [
            T(u),
            'UPDATE',
            $(e),
            er('SET', g, n),
            er('FROM', $, t),
            er('WHERE', st, o),
            at(s, 'order by'),
            A(a),
            Er(i),
          ]
            .filter(vr)
            .join(' ');
        },
        if: function (r) {
          var t = r.boolean_expr,
            e = r.else_expr,
            n = r.elseif_expr,
            o = r.if_expr,
            s = r.prefix,
            u = r.go,
            a = r.semicolons,
            i = r.suffix,
            c = [
              pr(r.type),
              st(t),
              dr(s),
              ''.concat(gr(o.ast || o)).concat(a[0]),
              pr(u),
            ];
          return (
            n &&
              c.push(
                n
                  .map(function (r) {
                    return [
                      pr(r.type),
                      st(r.boolean_expr),
                      'THEN',
                      gr(r.then.ast || r.then),
                      r.semicolon,
                    ]
                      .filter(vr)
                      .join(' ');
                  })
                  .join(' ')
              ),
            e && c.push('ELSE', ''.concat(gr(e.ast || e)).concat(a[1])),
            c.push(dr(i)),
            c.filter(vr).join(' ')
          );
        },
        insert: U,
        drop: kr,
        truncate: kr,
        replace: U,
        declare: function (r) {
          var t = r.type,
            e = r.declare,
            n = r.symbol,
            o = [pr(t)],
            s = e
              .map(function (r) {
                var t = r.at,
                  e = r.name,
                  n = r.as,
                  o = r.constant,
                  s = r.datatype,
                  u = r.not_null,
                  a = r.prefix,
                  i = r.definition,
                  c = r.keyword,
                  l = [[t, e].filter(vr).join(''), pr(n), pr(o)];
                switch (c) {
                  case 'variable':
                    (l.push.apply(l, [V(s)].concat(Or(br(r.collate)), [pr(u)])),
                      i && l.push(pr(i.keyword), st(i.value)));
                    break;
                  case 'cursor':
                    l.push(pr(a));
                    break;
                  case 'table':
                    l.push(pr(a), '('.concat(i.map(qr).join(', '), ')'));
                }
                return l.filter(vr).join(' ');
              })
              .join(''.concat(n, ' '));
          return (o.push(s), o.join(' '));
        },
        use: function (r) {
          var t = r.type,
            e = r.db,
            n = pr(t),
            o = fr(e);
          return ''.concat(n, ' ').concat(o);
        },
        rename: function (r) {
          var t = r.type,
            e = r.table,
            n = [],
            o = ''.concat(t && t.toUpperCase(), ' TABLE');
          if (e) {
            var s,
              u = Rr(e);
            try {
              for (u.s(); !(s = u.n()).done; ) {
                var a = s.value.map(F);
                n.push(a.join(' TO '));
              }
            } catch (r) {
              u.e(r);
            } finally {
              u.f();
            }
          }
          return ''.concat(o, ' ').concat(n.join(', '));
        },
        call: function (r) {
          var t = st(r.expr);
          return ''.concat('CALL', ' ').concat(t);
        },
        desc: function (r) {
          var t = r.type,
            e = r.table,
            n = pr(t);
          return ''.concat(n, ' ').concat(fr(e));
        },
        set: function (r) {
          var t = st(r.expr);
          return ''.concat('SET', ' ').concat(t);
        },
        lock: Ur,
        unlock: Ur,
        show: Fr,
        grant: Dr,
        revoke: Dr,
        proc: function (r) {
          var t = r.stmt;
          switch (t.type) {
            case 'assign':
              return Gr(t);
            case 'return':
              return (function (r) {
                var t = r.type,
                  e = r.expr;
                return [pr(t), st(e)].join(' ');
              })(t);
          }
        },
        raise: function (r) {
          var t = r.type,
            e = r.level,
            n = r.raise,
            o = r.using,
            s = [pr(t), pr(e)];
          return (
            n &&
              s.push(
                [dr(n.keyword), 'format' === n.type && n.expr.length > 0 && ',']
                  .filter(vr)
                  .join(''),
                n.expr
                  .map(function (r) {
                    return st(r);
                  })
                  .join(', ')
              ),
            o &&
              s.push(
                pr(o.type),
                pr(o.option),
                o.symbol,
                o.expr
                  .map(function (r) {
                    return st(r);
                  })
                  .join(', ')
              ),
            s.filter(vr).join(' ')
          );
        },
      };
      function Hr(r) {
        if (!r) return '';
        for (
          var t = $r[r.type],
            e = r,
            n = e._parentheses,
            o = e._orderby,
            s = e._limit,
            u = [n && '(', t(r)];
          r._next;

        ) {
          var a = $r[r._next.type],
            i = pr(r.set_op);
          (u.push(i, a(r._next)), (r = r._next));
        }
        return (
          u.push(n && ')', at(o, 'order by'), A(s)),
          u.filter(vr).join(' ')
        );
      }
      function Yr(r) {
        for (var t = [], e = 0, n = r.length; e < n; ++e) {
          var o = r[e] && r[e].ast ? r[e].ast : r[e];
          t.push(Hr(o));
        }
        return t.join(' ; ');
      }
      function Br(r) {
        return (
          (function (r) {
            if (Array.isArray(r)) return Vr(r);
          })(r) ||
          (function (r) {
            if (
              ('undefined' != typeof Symbol && null != r[Symbol.iterator]) ||
              null != r['@@iterator']
            )
              return Array.from(r);
          })(r) ||
          Wr(r) ||
          (function () {
            throw new TypeError(
              'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
            );
          })()
        );
      }
      function Wr(r, t) {
        if (r) {
          if ('string' == typeof r) return Vr(r, t);
          var e = Object.prototype.toString.call(r).slice(8, -1);
          return (
            'Object' === e && r.constructor && (e = r.constructor.name),
            'Map' === e || 'Set' === e
              ? Array.from(r)
              : 'Arguments' === e ||
                  /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
                ? Vr(r, t)
                : void 0
          );
        }
      }
      function Vr(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function qr(r) {
        if (!r) return [];
        var t,
          e,
          n,
          s,
          u = r.resource;
        switch (u) {
          case 'column':
            return K(r);
          case 'index':
            return (
              (e = []),
              (n = (t = r).keyword),
              (s = t.index),
              e.push(pr(n)),
              e.push(s),
              e.push.apply(e, o(c(t))),
              e.filter(vr).join(' ')
            );
          case 'constraint':
            return b(r);
          case 'sequence':
            return [pr(r.prefix), st(r.value)].filter(vr).join(' ');
          default:
            throw new Error('unknown resource = '.concat(u, ' type'));
        }
      }
      function Xr(r) {
        return r.dataType
          ? Lr(r)
          : [fr(r.db), fr(r.schema), fr(r.table)].filter(vr).join('.');
      }
      function Kr(r) {
        var t = r.type;
        switch (t) {
          case 'as':
            return [
              pr(t),
              r.symbol,
              Hr(r.declare),
              pr(r.begin),
              Yr(r.expr),
              pr(r.end),
              r.symbol,
            ]
              .filter(vr)
              .join(' ');
          case 'set':
            return [
              pr(t),
              r.parameter,
              pr(r.value && r.value.prefix),
              r.value && r.value.expr.map(st).join(', '),
            ]
              .filter(vr)
              .join(' ');
          default:
            return st(r);
        }
      }
      function Qr(r) {
        var t = r.type,
          e = r.symbol,
          n = r.value,
          o = [pr(t), e];
        switch (pr(t)) {
          case 'SFUNC':
            o.push([fr(n.schema), n.name].filter(vr).join('.'));
            break;
          case 'STYPE':
          case 'MSTYPE':
            o.push(Lr(n));
            break;
          default:
            o.push(st(n));
        }
        return o.filter(vr).join(' ');
      }
      function Zr(r) {
        if (!r) return '';
        var t = r.action,
          e = r.create_definitions,
          n = r.first_after,
          o = r.if_not_exists,
          s = r.keyword,
          u = r.old_column,
          a = r.prefix,
          i = r.resource,
          l = r.symbol,
          f = '',
          b = [];
        switch (i) {
          case 'column':
            b = [K(r)];
            break;
          case 'index':
            ((b = c(r)), (f = r[i]));
            break;
          case 'table':
          case 'schema':
            f = fr(r[i]);
            break;
          case 'aggregate':
          case 'function':
          case 'domain':
          case 'type':
            f = fr(r[i]);
            break;
          case 'algorithm':
          case 'lock':
          case 'table-option':
            f = [l, pr(r[i])].filter(vr).join(' ');
            break;
          case 'constraint':
            ((f = fr(r[i])), (b = [qr(e)]));
            break;
          case 'key':
            f = fr(r[i]);
            break;
          default:
            f = [l, r[i]]
              .filter(function (r) {
                return null !== r;
              })
              .join(' ');
        }
        return [
          pr(t),
          pr(s),
          pr(o),
          u && W(u),
          pr(a),
          f && f.trim(),
          b.filter(vr).join(' '),
          n && ''.concat(pr(n.keyword), ' ').concat(W(n.column)),
        ]
          .filter(vr)
          .join(' ');
      }
      function zr(r) {
        var t =
          r.default && [pr(r.default.keyword), st(r.default.value)].join(' ');
        return [pr(r.mode), r.name, Lr(r.type), t].filter(vr).join(' ');
      }
      function Jr(r) {
        return (Jr =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      function rt(r) {
        var t = r.expr_list;
        switch (pr(r.type)) {
          case 'STRUCT':
            return '('.concat(z(t), ')');
          case 'ARRAY':
            return (function (r) {
              var t = r.array_path,
                e = r.brackets,
                n = r.expr_list,
                o = r.parentheses;
              if (!n) return '['.concat(z(t), ']');
              if (Array.isArray(n))
                return '['.concat(
                  n
                    .map(function (r) {
                      return '('.concat(z(r), ')');
                    })
                    .filter(vr)
                    .join(', '),
                  ']'
                );
              var s = st(n);
              return e ? '['.concat(s, ']') : o ? '('.concat(s, ')') : s;
            })(r);
          default:
            return '';
        }
      }
      function tt(r) {
        var t = r.definition,
          e = [pr(r.keyword)];
        return (
          t && 'object' === Jr(t) && ((e.length = 0), e.push(Cr(t))),
          e.push(rt(r)),
          e.filter(vr).join('')
        );
      }
      function et(r) {
        return (et =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      var nt = {
        alter: Zr,
        aggr_func: function (r) {
          var t = r.args,
            e = r.filter,
            n = r.over,
            o = r.within_group_orderby,
            s = st(t.expr),
            u = r.name,
            a = y(n),
            i = ' ';
          (t.parentheses && ((i = ''), (s = '('.concat(s, ')'))),
            t.distinct && (s = ['DISTINCT', s].join(i)),
            t.orderby &&
              (s = ''.concat(s, ' ').concat(at(t.orderby, 'order by'))),
            t.separator &&
              (s = [s, pr(t.separator.keyword), dr(t.separator.value)]
                .filter(vr)
                .join(' ')));
          var c = o ? 'WITHIN GROUP ('.concat(at(o, 'order by'), ')') : '',
            l = e ? 'FILTER (WHERE '.concat(st(e.where), ')') : '';
          return [''.concat(u, '(').concat(s, ')'), c, a, l]
            .filter(vr)
            .join(' ');
        },
        any_value: function (r) {
          var t = r.args,
            e = r.type,
            n = r.over,
            o = t.expr,
            s = t.having,
            u = ''.concat(pr(e), '(').concat(st(o));
          return (
            s &&
              (u = ''
                .concat(u, ' HAVING ')
                .concat(pr(s.prefix), ' ')
                .concat(st(s.expr))),
            [(u = ''.concat(u, ')')), y(n)].filter(vr).join(' ')
          );
        },
        window_func: function (r) {
          var t = r.over;
          return [d(r), y(t)].filter(vr).join(' ');
        },
        array: tt,
        assign: Gr,
        binary_expr: C,
        case: function (r) {
          var t = ['CASE'],
            e = r.args;
          r.expr && t.push(st(r.expr));
          for (var n = 0, o = e.length; n < o; ++n)
            (t.push(e[n].type.toUpperCase()),
              e[n].cond && (t.push(st(e[n].cond)), t.push('THEN')),
              t.push(st(e[n].result)));
          return (t.push('END'), t.join(' '));
        },
        cast: w,
        column_ref: W,
        datatype: Lr,
        extract: function (r) {
          var t = r.args,
            e = r.type,
            n = t.field,
            o = t.cast_type,
            s = t.source,
            u = [''.concat(pr(e), '(').concat(pr(n)), 'FROM', pr(o), st(s)];
          return ''.concat(u.filter(vr).join(' '), ')');
        },
        flatten: function (r) {
          var t = r.args,
            e = r.type,
            n = ['input', 'path', 'outer', 'recursive', 'mode']
              .map(function (r) {
                return (function (r) {
                  if (!r) return '';
                  var t = r.type,
                    e = r.symbol,
                    n = r.value;
                  return [pr(t), e, st(n)].filter(vr).join(' ');
                })(t[r]);
              })
              .filter(vr)
              .join(', ');
          return ''.concat(pr(e), '(').concat(n, ')');
        },
        fulltext_search: function (r) {
          var t = r.against,
            e = r.as,
            n = r.columns,
            o = r.match,
            s = r.mode;
          return [
            [
              pr(o),
              '('.concat(
                n
                  .map(function (r) {
                    return W(r);
                  })
                  .join(', '),
                ')'
              ),
            ].join(' '),
            [
              pr(t),
              ['(', st(r.expr), s && ' '.concat(dr(s)), ')']
                .filter(vr)
                .join(''),
            ].join(' '),
            Q(e),
          ]
            .filter(vr)
            .join(' ');
        },
        function: L,
        insert: Hr,
        interval: M,
        show: Fr,
        struct: tt,
        tables: $,
        unnest: D,
        window: function (r) {
          return r.expr.map(v).join(', ');
        },
      };
      function ot(r) {
        var t = r.prefix,
          e = void 0 === t ? '@' : t,
          n = r.name,
          o = r.members,
          s = r.keyword,
          u = r.quoted,
          a = r.suffix,
          i = [];
        s && i.push(s);
        var c = o && o.length > 0 ? ''.concat(n, '.').concat(o.join('.')) : n,
          l = ''.concat(e || '').concat(c);
        return (
          a && (l += a),
          i.push(l),
          [u, i.join(' '), u].filter(vr).join('')
        );
      }
      function st(r) {
        if (r) {
          var t = r;
          if (r.ast) {
            var e = t.ast;
            Reflect.deleteProperty(t, e);
            for (var n = 0, o = Object.keys(e); n < o.length; n++) {
              var s = o[n];
              t[s] = e[s];
            }
          }
          return nt[t.type] ? nt[t.type](t) : dr(t);
        }
      }
      function ut(r) {
        return r ? r.map(st) : [];
      }
      function at(r, t) {
        if (!Array.isArray(r)) return '';
        var e = [],
          n = pr(t);
        switch (n) {
          case 'ORDER BY':
            e = r.map(function (r) {
              return [st(r.expr), r.type || 'ASC', pr(r.nulls)]
                .filter(vr)
                .join(' ');
            });
            break;
          case 'PARTITION BY':
          default:
            e = r.map(function (r) {
              return st(r.expr);
            });
        }
        return nr(n, e.join(', '));
      }
      ((nt.var = ot),
        (nt.expr_list = function (r) {
          var t = ut(r.value);
          return r.parentheses ? '('.concat(t.join(', '), ')') : t;
        }),
        (nt.select = function (r) {
          var t = 'object' === et(r._next) ? Hr(r) : _(r);
          return r.parentheses ? '('.concat(t, ')') : t;
        }),
        (nt.unary_expr = function (r) {
          var t = r.operator,
            e = r.parentheses,
            n = r.expr,
            o = '-' === t || '+' === t || '~' === t || '!' === t ? '' : ' ',
            s = ''.concat(t).concat(o).concat(st(n));
          return e ? '('.concat(s, ')') : s;
        }));
      var it = e(0);
      function ct(r) {
        return (ct =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      var lt,
        ft,
        bt,
        pt =
          ((lt = {}),
          (ft = 'mysql'),
          (bt = it.parse),
          (ft = (function (r) {
            var t = (function (r, t) {
              if ('object' !== ct(r) || null === r) return r;
              var e = r[Symbol.toPrimitive];
              if (void 0 !== e) {
                var n = e.call(r, t || 'default');
                if ('object' !== ct(n)) return n;
                throw new TypeError(
                  '@@toPrimitive must return a primitive value.'
                );
              }
              return ('string' === t ? String : Number)(r);
            })(r, 'string');
            return 'symbol' === ct(t) ? t : String(t);
          })(ft)) in lt
            ? Object.defineProperty(lt, ft, {
                value: bt,
                enumerable: !0,
                configurable: !0,
                writable: !0,
              })
            : (lt[ft] = bt),
          lt);
      function vt(r) {
        return (vt =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      function dt(r, t) {
        var e =
          ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
          r['@@iterator'];
        if (!e) {
          if (
            Array.isArray(r) ||
            (e = (function (r, t) {
              if (!r) return;
              if ('string' == typeof r) return yt(r, t);
              var e = Object.prototype.toString.call(r).slice(8, -1);
              'Object' === e && r.constructor && (e = r.constructor.name);
              if ('Map' === e || 'Set' === e) return Array.from(r);
              if (
                'Arguments' === e ||
                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)
              )
                return yt(r, t);
            })(r)) ||
            (t && r && 'number' == typeof r.length)
          ) {
            e && (r = e);
            var n = 0,
              o = function () {};
            return {
              s: o,
              n: function () {
                return n >= r.length
                  ? { done: !0 }
                  : { done: !1, value: r[n++] };
              },
              e: function (r) {
                throw r;
              },
              f: o,
            };
          }
          throw new TypeError(
            'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
          );
        }
        var s,
          u = !0,
          a = !1;
        return {
          s: function () {
            e = e.call(r);
          },
          n: function () {
            var r = e.next();
            return ((u = r.done), r);
          },
          e: function (r) {
            ((a = !0), (s = r));
          },
          f: function () {
            try {
              u || null == e.return || e.return();
            } finally {
              if (a) throw s;
            }
          },
        };
      }
      function yt(r, t) {
        (null == t || t > r.length) && (t = r.length);
        for (var e = 0, n = new Array(t); e < t; e++) n[e] = r[e];
        return n;
      }
      function wt(r, t) {
        for (var e = 0; e < t.length; e++) {
          var n = t[e];
          ((n.enumerable = n.enumerable || !1),
            (n.configurable = !0),
            'value' in n && (n.writable = !0),
            Object.defineProperty(r, Lt(n.key), n));
        }
      }
      function Lt(r) {
        var t = (function (r, t) {
          if ('object' !== vt(r) || null === r) return r;
          var e = r[Symbol.toPrimitive];
          if (void 0 !== e) {
            var n = e.call(r, t || 'default');
            if ('object' !== vt(n)) return n;
            throw new TypeError('@@toPrimitive must return a primitive value.');
          }
          return ('string' === t ? String : Number)(r);
        })(r, 'string');
        return 'symbol' === vt(t) ? t : String(t);
      }
      var Ct = (function () {
        function r() {
          !(function (r, t) {
            if (!(r instanceof t))
              throw new TypeError('Cannot call a class as a function');
          })(this, r);
        }
        var t, e, n;
        return (
          (t = r),
          (e = [
            {
              key: 'astify',
              value: function (r) {
                var t =
                    arguments.length > 1 && void 0 !== arguments[1]
                      ? arguments[1]
                      : rr,
                  e = this.parse(r, t);
                return e && e.ast;
              },
            },
            {
              key: 'sqlify',
              value: function (r) {
                var t =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : rr;
                return (ir(t), gr(r));
              },
            },
            {
              key: 'exprToSQL',
              value: function (r) {
                var t =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : rr;
                return (ir(t), st(r));
              },
            },
            {
              key: 'parse',
              value: function (r) {
                var t =
                    arguments.length > 1 && void 0 !== arguments[1]
                      ? arguments[1]
                      : rr,
                  e = t.database,
                  n = void 0 === e ? 'mysql' : e;
                ir(t);
                var o = n.toLowerCase();
                if (pt[o]) return pt[o](r.trim());
                throw new Error(''.concat(n, ' is not supported currently'));
              },
            },
            {
              key: 'whiteListCheck',
              value: function (r, t) {
                var e =
                  arguments.length > 2 && void 0 !== arguments[2]
                    ? arguments[2]
                    : rr;
                if (t && 0 !== t.length) {
                  var n = e.type,
                    o = void 0 === n ? 'table' : n;
                  if (
                    !this[''.concat(o, 'List')] ||
                    'function' != typeof this[''.concat(o, 'List')]
                  )
                    throw new Error(''.concat(o, ' is not valid check mode'));
                  var s,
                    u = this[''.concat(o, 'List')].bind(this),
                    a = u(r, e),
                    i = !0,
                    c = '',
                    l = dt(a);
                  try {
                    for (l.s(); !(s = l.n()).done; ) {
                      var f,
                        b = s.value,
                        p = !1,
                        v = dt(t);
                      try {
                        for (v.s(); !(f = v.n()).done; ) {
                          var d = f.value,
                            y = new RegExp(d, 'i');
                          if (y.test(b)) {
                            p = !0;
                            break;
                          }
                        }
                      } catch (r) {
                        v.e(r);
                      } finally {
                        v.f();
                      }
                      if (!p) {
                        ((c = b), (i = !1));
                        break;
                      }
                    }
                  } catch (r) {
                    l.e(r);
                  } finally {
                    l.f();
                  }
                  if (!i)
                    throw new Error(
                      "authority = '"
                        .concat(c, "' is required in ")
                        .concat(o, " whiteList to execute SQL = '")
                        .concat(r, "'")
                    );
                }
              },
            },
            {
              key: 'tableList',
              value: function (r, t) {
                var e = this.parse(r, t);
                return e && e.tableList;
              },
            },
            {
              key: 'columnList',
              value: function (r, t) {
                var e = this.parse(r, t);
                return e && e.columnList;
              },
            },
          ]) && wt(t.prototype, e),
          n && wt(t, n),
          Object.defineProperty(t, 'prototype', { writable: !1 }),
          r
        );
      })();
      function ht(r) {
        return (ht =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (r) {
                return typeof r;
              }
            : function (r) {
                return r &&
                  'function' == typeof Symbol &&
                  r.constructor === Symbol &&
                  r !== Symbol.prototype
                  ? 'symbol'
                  : typeof r;
              })(r);
      }
      ('object' === ('undefined' == typeof self ? 'undefined' : ht(self)) &&
        self &&
        (self.NodeSQLParser = { Parser: Ct, util: n }),
        !global &&
          'object' ===
            ('undefined' == typeof window ? 'undefined' : ht(window)) &&
          window &&
          (window.global = window),
        'object' ===
          ('undefined' == typeof global ? 'undefined' : ht(global)) &&
          global &&
          global.window &&
          (global.window.NodeSQLParser = { Parser: Ct, util: n }));
    },
  ])
);
//# sourceMappingURL=mysql.js.map
