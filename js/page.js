var selectedChar = "all";

var data = [];
var hcrow = []; 
var hccol = []; 
var rowLabel = [];
var colLabel = []; 
var numofSeasons = 25;

var mode = 0;   // 0: character|season. 1: character|episode. 2: season|character. 3: episode|character. 4: location|character

var characterFilter = {
	"ageMin": 0,
	"ageMax": 100,
	"male": 1,
	"female": 1,
	"showSingle": false
}

var selectedSeasons=[];
var selectedEpisodes=[];

var currentStats = {
	"numofFemale": 0,
	"numofMale": 0
}

var tblItems = 25,
	tblPage = 0;

function isCharacterShown(c) {
	if ((!characterFilter['male'] && c['gender'] === "M")
		|| (!characterFilter['female'] && c['gender'] === "W")
		|| (!characterFilter['showSingle'] && c['appearances'].length === 1))
		return false;

	if (characterFilter.ageMin === 0 && characterFilter.ageMax === 100)
		return true;

	var filtered = true,
		i;
	for (i = 0; i < c['age'].length; ++i) {
		if (parseInt(c['age'][i], 10) >= characterFilter['ageMin']
			&& parseInt(c['age'][i], 10) <= characterFilter['ageMax'], 10) {
			filtered = false;
			break;
		}
	}
	return !filtered;
}

function refreshGraph() {
	D3ok();
}

function main() {
	$('.multiselect').multiselect();
	characterList();
	episodeList();
	locationList();
	voiceActorList();

	$.each(seasons, function(i, a) {
		$('#seasonSelect').append('<option value="' + (i+1) + '">Season ' + a['season'] + '-' + a['years'] + '</option>');
	});

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
		maxHeight: 350
	});
	$('#characterSelect').change(function(e) {
		//console.log(this.options[e.target.selectedIndex].value);		
		var selected = this.options[e.target.selectedIndex].value,
			crt = characters[selected],
			img = document.getElementById('selectedCharacterIcon'),
			i, c;
		selectedChar = selected;	
		document.getElementById('chart').innerHTML = '';	
		refreshGraph();
		
		if (images[crt['image']]) {
			img.src = images[crt['image']];
		} else {
			img.src="http://wsamarketplace.com/wp-content/themes/classifiedstheme/thumbs/no-image.jpg";
		}
		
		data = [];
		hcrow = []; 
		hccol = [];
		rowLabel = [];
		colLabel = [];
		
		hcrow.push(1);
		if(mode === 0){
			for (i = 0; i < numofSeasons; ++i) {
				var tmp =[];
				tmp['row'] = 1;
				tmp['col'] = i+1;
				tmp['value'] = 0;
				data.push(tmp);
				hccol.push(i+1);
				colLabel.push(i+1);			
			}		
			rowLabel[0] = crt['page'];	
		}
		else if(mode === 1){
			for (i = 0; i < numofSeasons; ++i) {
				var tmp =[];
				tmp['row'] = 1;
				tmp['col'] = i+1;
				tmp['value'] = 0;
				data.push(tmp);
				hccol.push(i+1);
				colLabel.push(i+4);			
			}		
			rowLabel[0] = crt['page'];
		}
		//console.log(data);
		//console.log(hcrow);
		//console.log(hccol);
		//console.log(rowLabel);
		//console.log(colLabel);
		
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
		info.innerHTML = '<table class="table"><thead><tr><th>'+crt['name']+'</th></thead>'
            + '<tbody><tr><td>'+crt['gender']+'</td></tr><tr><td>'+crt['age'][0]+'</td></tr>'
            + '<tr><td><div style="height:60px;overflow-y:scroll;">'+ $.map(crt['cooc'], function(a,i){ return a[0] +' ('+a[1]+')'; }).join(', ') +'</div></td></tr>'
            + '</tbody></table>';
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
		maxHeight: 350
	});

	$('#seasonSelect').change(function (e){
		/*
		var o = document.getElementById("seasonSelect");
		var str = "";
		selectedSeasons = [];
		for(i=0;i<o.length;i++){
			if(o.options[i].selected){
				selectedSeasons.push(o.options[i].value);
			}
		}
		episodeList();
		*/
			
		/*
		var selected = this.options[e.target.selectedIndex].value;
		var selectedSeason = selected;	
		document.getElementById('chart').innerHTML = '';		
		//console.log(selectedSeason);
				
		data = [];
		hcrow = []; 
		hccol = [];
		rowLabel = [];
		colLabel = [];	
		var chars = []
		rowLabel[0] = "Season" + selectedSeason;
		hcrow[0] = 1;
		for (c in characters) {
			var tmp = [];
			tmp[0] = c;
			tmp[1] = 0;
			for(i = 0; i < characters[c]["appearances"].length; ++i) {				
				try{
					if(episodes[characters[c]["appearances"][i]]["s"] == parseInt(selectedSeason)){
						tmp[1]++;
						//console.log(episodes[characters[c]["appearances"][i]]);
					}				
				}
				catch(err){
					
				}
			}
			chars.push(tmp);
		}		
		chars = chars.sort(function(a, b){ return (a[1] > b[1] ? -1 : (a[1] < b[1] ? 1 : 0)); });		
		for (i = 0; i < numofSeasons; ++i) {
			var tmp =[];
			tmp['row'] = 1;
			tmp['col'] = i+1;
			tmp['value'] = chars[i][1];
			data.push(tmp);
			hccol.push(i+1);
			colLabel.push(chars[i][0]);
		}
		heatmap();		
		*/		
	});

	$('#episodeSelect').multiselect({
		includeSelectAllOption: true,
		enableCaseInsensitiveFiltering: true,
		enableFiltering: true,
		maxHeight: 350
	});
	$('#episodeSelect').change(function (){
		/*
		var o = document.getElementById("episodeSelect");
		var str = "";
		selectedEpisodes = [];
		for(i=0;i<o.length;i++){
			if(o.options[i].selected){
				selectedEpisodes.push(o.options[i].value);
			}
		}
		episodeList();
		*/
		
		//console.log(selectedSeasons);
	});


	$('#locationSelect').multiselect({
		includeSelectAllOption: true,
		enableCaseInsensitiveFiltering: true,
		enableFiltering: true,
		maxHeight: 350
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
		maxHeight: 350
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
	$('#single').change(function(e) {
		characterFilter['showSingle'] = e.target.checked;
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
		if (!isCharacterShown(c))
			return;

		if (c['gender'] === "M")
			currentStats['numofMale']++;
		else if (c['gender'] === "F")
			currentStats['numofFemale']++;

		var img = ($.type(c['image']) === 'string' && c['image']
			? ' data-image="data/images/xs/'+ c['image'].substr(c['image'][0] === 'F' ? 5 : 6).replace(/_/g, ' ') + '"'
			: '');
		$('#characterSelect').append('<option value="' + c['page'] + '"'+ img +'>' + c['name'] + '</option>');
	});
	refreshGraph();
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
	$.each(voiceactors, function(k, v) {
		$('#voiceActorSelect').append('<option value="' + k + '">' + k +' ('+ v.length +') </option>');
	});
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

function showHideIcon(){
	
}

function setSelectedValue(valueToSet) {
	var selectObj = document.getElementById('characterSelect');	
    for (var i = 0; i < selectObj.options.length; i++) {
    	//console.log(selectObj.options[i]);
        if (selectObj.options[i].value== valueToSet) {
            selectObj.options[i].selected = true;  
            console.log(selectObj.options[i].value);
            var evt = document.createEvent("HTMLEvents");   //create a event
            evt.initEvent("change", false, true);	//intial the event
            selectObj.dispatchEvent(evt);       //dispath the onchange event
            return;
        }
    }
}

$(main);
