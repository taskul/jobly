const { BadRequestError } = require("../expressError");

/** This function helps to create a string that will be part of the 
*   database query when sending a Patch request.
*
* dataToUpdate contains object with key/value pairs that come from a req.body
*
* jsToSql contains an object with key/value pairs that have the names that
* match the columns in a database
*
* jsToSql use .map to create an array ['"first_name"=$1', '"age"=$2']
*
* Returns a string that can be inserted into a SQL query
* "first_name"=$1,"age"=$2
* values is later used to create an index for inserting a company handle
* when trying to find a compnay by handle 
*/
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
