function main() {
  $('.multiselect').multiselect();
  for (var i = 1; i <= 100; i++) {
    $('#characterSelect').append('<option value="' + i + '">i</option>');
    $('#seasonSelect').append('<option value="' + i + '">' + i + '</option>');
    $('#episodeSelect').append('<option value="' + i + '">' + i + '</option>');
  }
  $('#characterSelect').multiselect({
    includeSelectAllOption: true,
    enableFiltering: true,
    maxHeight: 150
  });
  $('#seasonSelect').multiselect({
    includeSelectAllOption: true,
    enableFiltering: true,
    maxHeight: 150
  });
  $('#episodeSelect').multiselect({
    includeSelectAllOption: true,
    enableFiltering: true,
    maxHeight: 150
  });
};

$(main);
