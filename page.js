function main() {
  $('.multiselect').multiselect();
  for (var i = 1; i <= 100; i++) {
    $('#characterSelect').append('<option value="' + i + '" data-name="'+i+'" data-image="'+i+'">' + i + '</option>');
    $('#seasonSelect').append('<option value="' + i + '">' + i + '</option>');
    $('#episodeSelect').append('<option value="' + i + '">' + i + '</option>');
  }
  $('#characterSelect').multiselect({
    includeSelectAllOption: true,
    enableFiltering: true,
    label: function(element) {
        if (element.value === 'multiselect-all')
            return element.innerHTML;
        var el = $(element),
            ret = '<ul class="charsel">',
            img = el.data('image'),
            page = el.text(),
            name = el.data('name');

        if (img)
            ret += '<li><img class="charsel-image" src="'+ img + '" alt="'+ page +'"></li>';
        ret += '<li class="charsel-name">' + page + '</li>';
        if (page !== name)
            ret += '<li class="charsel-fullname">' + img + '</li>';
        ret += '</ul>';
        return ret;
    },
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
