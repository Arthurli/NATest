module.exports = function fetchField(body, paths) {

  var field = body

  for (var i in paths) {
    var path = paths[i];

    var patrn=/^[(]{1}[\w]+[)]{1}$/;
    if (patrn.test(path)) {
      field = getAttribute(field ,path);
    } else {
      field = field[path];
    }

    if (!field && field !== 0) {
      return null
    }
  }
  
  return field;
};

function getAttribute(field, path) {
  var attribute = path.slice(1, path.length-1);
  var patrn=/^[0-9]\d*$/;

  switch (attribute) {
    case "count":
      return field.length;
      break;
    case "length":
      return field.length;
      break;
    default:  
      if (patrn.test(attribute)) {  
        return field[Number(attribute)];
      }
    return field;
  }
}