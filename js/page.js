var selectedChar = "all";

var data = [
{row: 1, col: 1, value: 0},
{row: 1, col: 2, value: 0},
{row: 1, col: 3, value: 0},
{row: 1, col: 4, value: 0},
{row: 1, col: 5, value: 0},
{row: 1, col: 6, value: 0},
{row: 1, col: 7, value: 0},
{row: 1, col: 8, value: 0},
{row: 1, col: 9, value: 0},
{row: 1, col: 10, value: 0},
{row: 1, col: 11, value: 0},
{row: 1, col: 12, value: 0},
{row: 1, col: 13, value: 0},
{row: 1, col: 14, value: 0},
{row: 1, col: 15, value: 0},
{row: 1, col: 16, value: 0},
{row: 1, col: 17, value: 0},
{row: 1, col: 18, value: 0},
{row: 1, col: 19, value: 0},
{row: 1, col: 20, value: 0},
{row: 1, col: 21, value: 0},
{row: 1, col: 22, value: 0},
{row: 1, col: 23, value: 0},
{row: 1, col: 24, value: 0},
{row: 1, col: 25, value: 0},
];
var hcrow = [1]; // change to gene name or probe id
var hccol = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]; // change to gene name or probe id
var rowLabel = ['Homer Simpson']; // change to gene name or probe id
var colLabel = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25']; // change to contrast name

var characterFilter = {
	"filter": 1,
	"ageMin": 0,
	"ageMax": 100,
	"male": 1,
	"female": 1,
	"selectedIndex": -1,
}

var selectedSeasons=[];
var selectedEpisodes=[];

var currentStats = {
	"numofFemale": 0,
	"numofMale": 0
}

var tblItems = 25,
	tblPage = 0;


function main() {
	$('.multiselect').multiselect();
	characterList();
	episodeList();
	locationList();
	voiceActorList();

	for (var i=0; i<seasons.length;i++){
		try{
			$('#seasonSelect').append('<option value="' + (i+1).toString() + '">Season ' + seasons[i]['season'] + '-' + seasons[i]['years'] + '</option>');
		}
		catch(err){
			console.log(i);
		}
	}

	$('#characterSelect').multiselect({
		includeSelectAllOption: true,
		enableFiltering: true,
		filterBehavior: 'both', // filter value and text
		enableCaseInsensitiveFiltering: true,
		label: function(element) {
			if (element.value === 'multiselect-all' || !element.value)
					return element.innerHTML;
			var el = $(element),
				ret = '<ul class="charsel">',
				img = el.data('image'),
				page = el.val(),
				name = el.text();

			if (img)
				ret += '<li><img class="charsel-image" width="20px" src="'+ img + '" alt="'+ page +'"></li>';
			ret += '<li class="charsel-name">' + page + '</li>';
			if (page !== name)
				ret += '<li class="charsel-fullname">' + name + '</li>';
			ret += '</ul>';
			return ret;
		},
		maxHeight: 150
	});
	$('#characterSelect').change(function(e) {
		//console.log(this.options[e.target.selectedIndex].value);		
		var selected = this.options[e.target.selectedIndex].value,
			crt = characters[selected],
			img = document.getElementById('selectedCharacterIcon'),
			i, c;
		selectedChar = selected;	
		document.getElementById('chart').innerHTML = '';	
		D3ok();	
		
		if (images[crt['image']]) {
			img.src = images[crt['image']];
		} else {
			img.src="http://wsamarketplace.com/wp-content/themes/classifiedstheme/thumbs/no-image.jpg";
		}
		for (i = 0; i < data.length; ++i) {
			data[i]["value"] = 0;
		}	
		rowLabel[0] = crt['name'];		
		for (c in characters) {
			if (characters.hasOwnProperty(c)) {
				if (c === selected){
					for(i = 0; i < characters[c]["appearances"].length; ++i) {
						try{
							data[episodes[characters[c]["appearances"][i]]["s"]-1]["value"]++;
						}
						catch(err){
							//console.log(characters[c]);
							//console.log(characters[c]["appearances"]);
							//console.log(episodes[characters[c]["appearances"][i]]);
						}
					}
					break;
				}
			}
		}
		var info = document.getElementById('selectedCharacterInfo');
		info.innerHTML = '<table class="table"><thead><tr><th>'+crt['name']+'</th></thead><tbody><tr><td>'+crt['gender']+'</td></tr><tr><td>'+crt['age'][0]+'</td></tr><tr><td>'+crt['cooc'][0]+'</td></tr></tbody></table>';
		/*
		for (var i=0; i<characters[selected]['appearances'].length;i++){
			for (var j=0; j<episodes.length;j++){
				if (characters[selectedIndex]['appearances'][i] == episodes[j]['title']){
					data[episodes[j]["s"]-1]["value"]++;
					//console.log("dfdf");
				}
			}
		}*/
		/******************************* heap map start**********************/
		heatmap();
	/***********************heat map end***********************/
	});

	$('#seasonSelect').multiselect({
		includeSelectAllOption: true,
		enableCaseInsensitiveFiltering: true,
		enableFiltering: true,
		maxHeight: 150
	});

	$('#seasonSelect').change(function (){
		var o = document.getElementById("seasonSelect");
		var str = "";
		selectedSeasons = [];
		for(i=0;i<o.length;i++){
			if(o.options[i].selected){
				selectedSeasons.push(o.options[i].value);
			}
		}
		episodeList();
		//console.log(selectedSeasons);
	});

	$('#episodeSelect').multiselect({
		includeSelectAllOption: true,
		enableCaseInsensitiveFiltering: true,
		enableFiltering: true,
		maxHeight: 150
	});
	$('#episodeSelect').change(function (){
		var o = document.getElementById("episodeSelect");
		var str = "";
		selectedEpisodes = [];
		for(i=0;i<o.length;i++){
			if(o.options[i].selected){
				selectedEpisodes.push(o.options[i].value);
			}
		}
		episodeList();
		//console.log(selectedSeasons);
	});


	$('#locationSelect').multiselect({
		includeSelectAllOption: true,
		enableCaseInsensitiveFiltering: true,
		enableFiltering: true,
		maxHeight: 150
	});

	$('#locationSelect').change(function(){
		var selected = document.getElementById('locationSelect');
		var selectedIndex = selected.options[selected.selectedIndex].value;
		//alert(selectedIndex);
		var img = document.getElementById('selectedLocationIcon');
		if(images[locations[selectedIndex]['image']]!=undefined){
			img.src=images[locations[selectedIndex]['image']];
		}
		else{
			img.src="http://wsamarketplace.com/wp-content/themes/classifiedstheme/thumbs/no-image.jpg";
		}
	});

	$('#voiceActorSelect').multiselect({
		includeSelectAllOption: true,
		enableFiltering: true,
		enableCaseInsensitiveFiltering: true,
		maxHeight: 150
	});

	$('#voiceActorSelect').change(function(){
		var selected = document.getElementById('voiceActorSelect');
		var selectedIndex = selected.options[selected.selectedIndex].value;
		//alert(selectedIndex);
		var characterBox = document.getElementById('characterBox');
		characterBox.innerHTML = "";
		for(var i=0; i<voiceactors[selectedIndex].length; i++){
			var html = "<img width='50px' height='100px' src='"+ images[characters[voiceactors[selectedIndex][i]]['image']] +"' alt='"+voiceactors[selectedIndex]+"'>";
			//alert(html);
			characterBox.innerHTML += html;
		}
	});

	$('#male').change(function(){
		if(document.getElementById('male').checked){
			characterFilter['male'] = 1;
		}
		else{
			characterFilter['male'] = 0;
		}
		characterList();
		//console.log(characterFilter);
	});

	$('#female').change(function(){
		if(document.getElementById('female').checked){
			characterFilter['female'] = 1;
		}
		else{
			characterFilter['female'] = 0;
		}
		//console.log(characterFilter);
		characterList();
	});
	$("#ageSlider").slider({});
	$("#ageSlider").on('slide', function(slideEvt) {
		//console.log(slideEvt.value);
		characterFilter['ageMin'] = slideEvt.value[0];
		characterFilter['ageMax'] = slideEvt.value[1];
		characterList();
		//console.log(characterFilter);
	});

	init_data_table();
}

function characterList() {
	cleanOptions('characterSelect');
	currentStats['numofMale'] = 0;
	currentStats['numofFemale'] = 0;
	$('#characterSelect').append('<option value="">' + 'Select a character' + '</option>');
	$.each(characters, function(idx, c) {
		if (characterFilter['filter']) {
			if (c['gender'] === "M")
				currentStats['numofMale']++;
			else if (c['gender'] === "W")
				currentStats['numofFemale']++;

			if ((!characterFilter['male'] && c['gender'] === "M")
				|| (!characterFilter['female'] && c['gender'] === "W"))
				return;

			var filtered = true,
				i;
			for (i = 0; i < c['age'].length; ++i) {
				if (parseInt(c['age'][i], 10) >= characterFilter['ageMin']
					&& parseInt(c['age'][i], 10) <= characterFilter['ageMax'], 10) {
					filtered = false;
					break;
				}
			}
			if (filtered)
				return;
		}
		var img = ($.type(c['image']) === 'string' && c['image']
			? ' data-image="data/images/xs/'+ c['image'].substr(c['image'][0] === 'F' ? 5 : 6).replace(/_/g, ' ') + '"'
			: '');
		$('#characterSelect').append('<option value="' + c['page'] + '"'+ img +'>' + c['name'] + '</option>');
	});
}

function episodeList(){
	cleanOptions('episodeSelect');
	var numofShow = 0;
	if(selectedSeasons.length < 1){
		for (var i=0; i<episodes.length;i++){
			$('#episodeSelect').append('<option value="' + i + '">' + episodes[i]['title'] + '-' + episodes[i]['airing'] +'</option>');
			numofShow++;
		}
	}
	else{
		for (var i=0; i<episodes.length;i++){
			if(selectedSeasons.indexOf(episodes[i]['s'].toString())!=-1){
				$('#episodeSelect').append('<option value="' + i + '">' + episodes[i]['title'] + '-' + episodes[i]['airing'] +'</option>');
				numofShow++;
			}
			//console.log(episodes[i]['s'].toString());
			//console.log(selectedSeasons.indexOf(episodes[i]['s'].toString()));
		}
	}
	console.log(numofShow);
}

function locationList(){
	cleanOptions('locationSelect');
	for (var l in locations){
		$('#locationSelect').append('<option value="' + l + '">' + l +'</option>');
	}
}

function voiceActorList(){
	cleanOptions('voiceActorSelect');
	for (var v in voiceactors){
		$('#voiceActorSelect').append('<option value="' + v + '">' + v +'</option>');
	}
}

function cleanOptions(id){
	$('#'+id).empty();
}

function init_data_table() {
	function printHeader(type) {
		$('#tbldata').empty();
		var th = '';
        switch(type) {
        case 'char':
			th = '<th>Page</th><th>Name</th><th>Image</th><th>Gender</th><th>Alive</th>'
				 + '<th>Age</th><th>Voiced By</th><th>Appearances</th>';
            break;
        case 'loc':
			th = '<th>Page</th><th>Location</th><th>image</th><th>Appearances</th>';
            break;
        case 'seasons':
			th = '<th>Episode</th><th>title</th><th>Original Airing</th>';
        }
		$('#tbldata').append('<table><thead>'+ th + '</thead><tbody id="tbldatabody"></tbody></table>');
	}
	function newPage(e) {
		e.preventDefault();
		if (e.target.id === 'tbldataprev' && tblPage > 0) {
			tblPage -= 1;
			onSourceChange(false);
		} else if (e.target.id === 'tbldatanext') {
			tblPage += 1;
			onSourceChange(false);
		}
	}
	function onSourceChange(reset) {
        var val = $('#seldata').val();
		var i;
		printHeader(val);
		if (reset !== false)
			tblPage = 0;
        switch (val) {
        case 'char':
			i = -1;
			$.each(characters, function(k, o) {
				i += 1;
				if (i < tblPage * tblItems)
					return; // skip
				if (i >= (tblPage+1) * tblItems)
					return false; // abort
				var tr = [];
				tr.push(o.page);
				tr.push(o.name);
				tr.push(o.image);
				tr.push(o.gender);
				tr.push(o.isAlive);
				tr.push(o.age.join(' '));
				tr.push(o.voicedBy.join('<br>'));
				tr.push(o.appearances.length);
				$('#tbldatabody').append('<tr><td>'+ tr.join('</td><td>') + '</tr></td>');
			});
            break;
        case 'loc':
			i = -1;
			$.each(locations, function(k, o) {
				i += 1;
				if (i < tblPage * tblItems)
					return; // skip
				if (i >= (tblPage+1) * tblItems)
					return false; // abort
				var tr = [];
				tr.push(o.page);
				tr.push(o.location);
				tr.push(o.image);
				tr.push(o.appearances.length);
				$('#tbldatabody').append('<tr><td>'+ tr.join('</td><td>') + '</tr></td>');
			});
            break;
        case 'seasons':
			$.each(episodes, function(i, o) {
				if (i < tblPage * tblItems)
					return; // skip
				if (i >= (tblPage+1) * tblItems)
					return false; // abort
				var tr = [];
				tr.push('S'+ o.s +', E'+ o.e);
				tr.push(o.title);
				tr.push(o.airing);
				$('#tbldatabody').append('<tr><td>'+ tr.join('</td><td>') + '</tr></td>');
			});
        }
	}
    $('#tbldataprev').on('click', newPage);
    $('#tbldatanext').on('click', newPage);
    $('#seldata').on('change', onSourceChange);
	onSourceChange();
}

$(main);
