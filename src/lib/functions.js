exports.database = database;

function database(params) {
  return { value: params.session.getCurrentDatabase() };
}
