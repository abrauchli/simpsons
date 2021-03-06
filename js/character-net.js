/* ---------------------------------------------------------------------------
   (c) Telefï¿½nica I+D, 2013
   Author: Paulo Villegas
   (c) Andreas Brauchli, Tianli Mo, 2014 (Changes)

   This script is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
   -------------------------------------------------------------------------- */

// -------------------------------------------------------------------
// A number of forward declarations. These variables need to be defined since
// they are attached to static code in HTML. But we cannot define them yet
// since they need D3.js stuff. So we put placeholders.


// Highlight a movie in the graph. It is a closure within the d3.json() call.
var selectMovie = undefined;

// Change status of a panel from visible to hidden or viceversa
var toggleDiv = undefined;

// Clear all help boxes and select a movie in network and in movie details panel
var clearAndSelect = undefined;


// The call to set a zoom value -- currently unused
// (zoom is set via standard mouse-based zooming)
var zoomCall = undefined;


// -------------------------------------------------------------------

// Do the stuff -- to be called after D3.js has loaded
function D3ok() {
  // Some constants
  var WIDTH = 750,
      HEIGHT = 425,
      SHOW_THRESHOLD = 2.5;

  // Variables keeping graph state
  var activeMovie = undefined;
  var currentOffset = { x : 0, y : 0 };
  var currentZoom = 1.0;

  // The D3.js scales
  var xScale = d3.scale.linear()
    .domain([0, WIDTH])
    .range([0, WIDTH]);
  var yScale = d3.scale.linear()
    .domain([0, HEIGHT])
    .range([0, HEIGHT]);
  var zoomScale = d3.scale.linear();
    //.domain([1,6])
    //.range([1,6])
    //.clamp(true);

/* .......................................................................... */

  // The D3.js force-directed layout
  var force = d3.layout.force()
    .charge(-320)
    .size( [WIDTH, HEIGHT] )
    .linkStrength( function(d,idx) { return d.weight; } );

  // Add to the page the SVG element that will contain the movie network

  document.getElementById('movieNetwork').innerHTML = '';  //remove the previous svg element when initial

  var svg = d3.select("#movieNetwork").append("svg:svg")
    .attr('xmlns','http://www.w3.org/2000/svg')
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("id","graph")
    .attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT )
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Movie panel: the div into which the movie details info will be written
  movieInfoDiv = d3.select("#movieInfo");

  /* ....................................................................... */

  // Get the current size & offset of the browser's viewport window
  function getViewportSize( w ) {
    var w = w || window;
    if( w.innerWidth != null )
      return { w: w.innerWidth,
         h: w.innerHeight,
         x : w.pageXOffset,
         y : w.pageYOffset };
    var d = w.document;
    if( document.compatMode == "CSS1Compat" )
      return { w: d.documentElement.clientWidth,
         h: d.documentElement.clientHeight,
         x: d.documentElement.scrollLeft,
         y: d.documentElement.scrollTop };
    else
      return { w: d.body.clientWidth,
         h: d.body.clientHeight,
         x: d.body.scrollLeft,
         y: d.body.scrollTop};
  }



  function getQStringParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }


  /* Change status of a panel from visible to hidden or viceversa
     id: identifier of the div to change
     status: 'on' or 'off'. If not specified, the panel will toggle status
  */
  toggleDiv = function( id, status ) {
    d = d3.select('div#'+id);
    if( status === undefined )
      status = d.attr('class') == 'panel_on' ? 'off' : 'on';
    d.attr( 'class', 'panel_' + status );
    return false;
  }


  /* Clear all help boxes and select a movie in the network and in the
     movie details panel
  */
  clearAndSelect = function (id) {
    toggleDiv('faq','off');
    toggleDiv('help','off');
    selectMovie(id,true);  // we use here the selectMovie() closure
  }


  /* Compose the content for the panel with movie details.
     Parameters: the node data, and the array containing all nodes
  */
  function getMovieInfo( n, nodeArray ) {
    info = '<div id="cover">';
    info += '<div class="cover-name">' + n.page + '</div>';
    if (images[n.image])
      info += '<img class="cover-image" style="max-height:200px;max-width:190px;" src="' + images[n.image] + '" title="' + n.page + '"/>';
    info += '<div class="cover-link">Full details on the <a href="http://simpsons.wikia.com/wiki/'+ n.page +'" target="_new">Simpsons Wiki</a></div>';

    info +=
    '<img src="images/close.png" class="cover-close action" title="close panel" onClick="toggleDiv(\'movieInfo\');"/>' +
    '<img src="images/target-32.png" class="action" style="top: 280px;" title="Center graph on character" onclick="selectMovie('+n.index+',true);"/>';

    info += '<br/></div><div style="clear: both;">'
    if( n.age )
      info += '<div class="f"><span class="l">Age</span>: <span class="g">'
           + n.age + '</span></div>';
    if( n.gender )
      info += '<div class="f"><span class="l">Gender</span>: <span class="d">'
           + n.gender + '</span></div>';
    if( n.voicedBy )
      info += '<div class="f"><span class="l">Voice Actors</span>: <span class="c">'
           + n.voicedBy + '</span></div>';
    info += '<div class="f"><span class="l">Alive</span>: ' + (n.isAlive ? 'Yes' : 'No')
           + '</div>';
    if( n.name )
      info += '<div class="f"><span class="l">Full Name</span>: <span class="c">'
           + n.name + '</span></div>';
    info += '<div class="f"><span class="l"></span><span class="c">' + '<button type="button" class="btn btn-info btn-sm" onClick="setSelectedValue(\''+n.page+'\');">GO!</button>' + '</span></div>';
    info += '</div>';

    return info;
  }


  // *************************************************************************

(function() {
  var highChars = {}, // highlighted characters
      data = { nodes: [], links: [] },
      idx = {},
      i = 0;

  function addCloneObj(o) {
    // Deep-clone all characters into data.nodes array
    var c = $.extend(true, {}, o);
    c.index = i; // put the array index on the clone
    if (c.image)
        c.img = c.image.substr(c.image[0] === 'F' ? 5 : 6);
    data.nodes.push(c);
    idx[o.page] = i++;
  }

  if (selectedChar === 'all' || !characters[selectedChar]) {
    $.each(characters, function(k, o) {
      if (isCharacterShown(o))
        addCloneObj(o);
    });
    $.each(data.nodes, function(i, o) {
      $.each(o.cooc, function(ci, e) {
        if (e[1] < 10) // ignore links between all nodes with < 10 coocurrances
          return false; // abort since cooc is sorted
        if (!idx[e[0]]) // ignore links to hidden characters
          return;

        var tgt = idx[e[0]],
            l = {
              source: i,
              target: tgt,
              weight: e[1] / 459 // the maximal value
            };
        data.links.push(l);

        var cooc = data.nodes[tgt].cooc,
            j;
        // remove reciprocal link
        for (j = 0; j < cooc.length; ++j) {
          if (cooc[j][0] === o.page) {
            cooc.splice(1, i);
            break;
          }
        }
      });
    });

  } else {
    var o = characters[selectedChar];
    var selectedSize = 0;
    addCloneObj(o);
    $.each(o.cooc, function(idx, a) {
      selectedSize += a[1];
      highChars[a[0]] = a[1];

      var o = characters[a[0]];
      if (isCharacterShown(o))
        addCloneObj(o);
    });
    highChars[selectedChar] = selectedSize / (selectedSize > 0 ? o.cooc[0][1] : 1);

    $.each(data.nodes, function(i, o) {
      $.each(o.cooc, function(ci, e) {
        if (!idx[e[0]]) // ignore links to hidden characters
          return;

        var tgt = idx[e[0]],
            l = {
              source: i,
              target: tgt,
              weight: e[1] / highChars[selectedChar] // the maximal value
            };
        data.links.push(l);

        var cooc = data.nodes[tgt].cooc,
            j;
        // remove reciprocal link
        for (j = 0; j < cooc.length; ++j) {
          if (cooc[j][0] === o.page) {
            cooc.splice(1, i);
            break;
          }
        }
      });
    });
  }


  // Declare the variables pointing to the node & link arrays
  var nodeArray = data.nodes;
  var linkArray = data.links;

  var maxNodeWeight =
    selectedChar === 'all'
      ? 549
      : Math.max.apply( null, nodeArray.map( function(n) {return highChars[n.page];} ) );
  var minLinkWeight = //0.0;
    Math.min.apply( null, linkArray.map( function(n) {return n.weight;} ) );
  var maxLinkWeight = //1.0;
    Math.max.apply( null, linkArray.map( function(n) {return n.weight;} ) );

  // Add the node & link arrays to the layout, and start it
  force
    .nodes(nodeArray)
    .links(linkArray)
    .start();

  // A couple of scales for node radius & edge width
  var node_size_f = d3.scale.linear();
  if (selectedChar === 'all')
    node_size_f = node_size_f.domain([10,549]);
  else
    node_size_f = node_size_f.domain([1,maxNodeWeight]);
  node_size_f = node_size_f.range([1,16]).clamp(true);
  function node_size(d) {
    if (selectedChar === 'all')
      return node_size_f(d.cooc.length);
    return node_size_f(highChars[d.page]);
  };
  var edge_width = d3.scale.linear() // used to be pow().exponent(8) instead of linear
    .domain([minLinkWeight,maxLinkWeight])
    .range([1,3])
    .clamp(true);

var edge_opacity = d3.scale.pow().exponent(0.0125)
  .domain([minLinkWeight,maxLinkWeight])
  .range([0,1])
  .clamp(true);

  /* Add drag & zoom behaviours */
  svg.call( d3.behavior.drag()
      .on("drag",dragmove) );
  svg.call( d3.behavior.zoom()
      .x(xScale)
      .y(yScale)
      //.scaleExtent([1, 6])
      .on("zoom", doZoom) );

  // ------- Create the elements of the layout (links and nodes) ------

  var pat = svg.append('defs')
    .selectAll('defs')
    .data(nodeArray.filter(function(d) { return !!d.img && d.cooc.length > 40; }))
    .enter()
    .append('pattern')
      .attr('id', function(d) { return d.img.replace(/[ '()]/g, '_'); })
      //.attr('x', 0).attr('y', 0)
      //.attr('patternUnits', 'userSpaceOnUse')
      .attr('height', 20).attr('width', 20);

  pat.append('rect')
      .attr('height', 50).attr('width', 50)
      .attr('fill', '#B2D9D8');
  pat.append('image')
      //.attr('x', 0).attr('y', 0)
      .attr('height', 20).attr('width', 20)
      .attr('xlink:href', function(d) { return 'data/images/xs/'+ d.img; });

  var networkGraph = svg.append('svg:g').attr('class','grpParent');

  // links: simple lines
  var graphLinks = networkGraph.append('svg:g').attr('class','grp gLinks')
    .selectAll("line")
    .data(linkArray, function(d) {return d.source.page+'-'+d.target.page;} )
    .enter().append("line")
    .style('stroke-width', function(d) { return edge_width(d.weight);} )
    .style('stroke-opacity', function(d) { return edge_opacity(d.weight);} )
    .attr("class", "link");

  // nodes: an SVG circle
  var graphNodes = networkGraph.append('svg:g').attr('class','grp gNodes')
    .selectAll("circle")
    .data( nodeArray, function(d){return d.page} )
    .enter().append("svg:circle")
    .attr('id', function(d) { return "c" + d.index; } )
    .attr('class', function(d) {
      if (d.page === selectedChar)
        return 'node level1';
      return 'node level'+ (d.cooc.length < 5 ? 3 : d.cooc.length < 30 ? 2 : 1);
    })
    .attr('r', node_size)
    .attr('pointer-events', 'all')
    .attr('fill', function(d) { return d.img && d.cooc.length > 40 ? 'url(#'+ d.img.replace(/[ '()]/g, '_') +')' : 'rgba(50,50,250,0.1)'; })
    //.on("click", function(d) { highlightGraphNode(d,true,this); } )
    .on("click", function(d) { showMoviePanel(d); } )
    .on("mouseover", function(d) { highlightGraphNode(d,true,this);  } )
    .on("mouseout",  function(d) { highlightGraphNode(d,false,this); } );

  // labels: a group with two SVG text: a title and a shadow (as background)
  var graphLabels = networkGraph.append('svg:g').attr('class','grp gLabel')
    .selectAll("g.label")
    .data( nodeArray, function(d){return d.page} )
    .enter().append("svg:g")
    .attr('id', function(d) { return "l" + d.index; } )
    .attr('class','label');

  shadows = graphLabels.append('svg:text')
    .attr('x','-2em')
    .attr('y','-.3em')
    .attr('pointer-events', 'none') // they go to the circle beneath
    .attr('id', function(d) { return "lb" + d.index; } )
    .attr('class','nshadow')
    .text( function(d) { return d.page; } );

  labels = graphLabels.append('svg:text')
    .attr('x','-2em')
    .attr('y','-.3em')
    .attr('pointer-events', 'none') // they go to the circle beneath
    .attr('id', function(d) { return "lf" + d.index; } )
    .attr('class','nlabel')
    .text( function(d) { return d.page; } );


  /* --------------------------------------------------------------------- */
  /* Select/unselect a node in the network graph.
     Parameters are:
     - node: data for the node to be changed,
     - on: true/false to show/hide the node
  */
  function highlightGraphNode( node, on )
  {
    //if( d3.event.shiftKey ) on = false; // for debugging

    // If we are to activate a movie, and there's already one active,
    // first switch that one off
    if( on && activeMovie !== undefined ) {
      highlightGraphNode( nodeArray[activeMovie], false );
    }

    // locate the SVG nodes: circle & label group
    circle = d3.select( '#c' + node.index );
    label  = d3.select( '#l' + node.index );

    // activate/deactivate the node itself
    circle.classed( 'main', on );
    label.classed( 'on', on || currentZoom >= SHOW_THRESHOLD );
    label.selectAll('text').classed( 'main', on );

    // activate all siblings
    if (node.links) {
      Object(node.links).forEach(function(id) {
        d3.select("#c"+id).classed( 'sibling', on );
        label = d3.select('#l'+id);
        label.classed( 'on', on || currentZoom >= SHOW_THRESHOLD );
        label.selectAll('text.nlabel')
          .classed( 'sibling', on );
      });
    }

    // set the value for the current active movie
    activeMovie = on ? node.index : undefined;
  }


  /* --------------------------------------------------------------------- */
  /* Show the details panel for a movie AND highlight its node in
     the graph. Also called from outside the d3.json context.
     Parameters:
     - new_idx: index of the movie to show
     - doMoveTo: boolean to indicate if the graph should be centered
       on the movie
  */
  selectMovie = function( new_idx, doMoveTo ) {

    // do we want to center the graph on the node?
    doMoveTo = doMoveTo || false;
    if( doMoveTo ) {
      s = getViewportSize();
      width  = s.w<WIDTH ? s.w : WIDTH;
      height = s.h<HEIGHT ? s.h : HEIGHT;
      offset = { x : s.x + width/2  - nodeArray[new_idx].x*currentZoom,
         y : s.y + height/2 - nodeArray[new_idx].y*currentZoom };
      repositionGraph( offset, undefined, 'move' );
    }
    // Now highlight the graph node and show its movie panel
    highlightGraphNode( nodeArray[new_idx], true );
    showMoviePanel( nodeArray[new_idx] );
  }


  /* --------------------------------------------------------------------- */
  /* Show the movie details panel for a given node
   */
  function showMoviePanel( node ) {
    // Fill it and display the panel
    movieInfoDiv
      .html( getMovieInfo(node,nodeArray) )
      .attr("class","panel_on");
  }


  /* --------------------------------------------------------------------- */
  /* Move all graph elements to its new positions. Triggered:
     - on node repositioning (as result of a force-directed iteration)
     - on translations (user is panning)
     - on zoom changes (user is zooming)
     - on explicit node highlight (user clicks in a movie panel link)
     Set also the values keeping track of current offset & zoom values
  */
  function repositionGraph( off, z, mode ) {

    // do we want to do a transition?
    var doTr = (mode == 'move');

    // drag: translate to new offset
    if( off !== undefined &&
        (off.x != currentOffset.x || off.y != currentOffset.y ) ) {
      g = d3.select('g.grpParent')
      if( doTr )
        g = g.transition().duration(500);
      g.attr("transform", function(d) { return "translate("+
            off.x+","+off.y+")" } );
      currentOffset.x = off.x;
      currentOffset.y = off.y;
    }

    // zoom: get new value of zoom
    if( z === undefined ) {
      if( mode != 'tick' )
        return;  // no zoom, no tick, we don't need to go further
      z = currentZoom;
    } else
      currentZoom = z;

    // move edges
    e = doTr ? graphLinks.transition().duration(500) : graphLinks;
    e
      .attr("x1", function(d) { return z*(d.source.x); })
        .attr("y1", function(d) { return z*(d.source.y); })
        .attr("x2", function(d) { return z*(d.target.x); })
        .attr("y2", function(d) { return z*(d.target.y); });

    // move nodes
    n = doTr ? graphNodes.transition().duration(500) : graphNodes;
    n
  .attr("transform", function(d) { return "translate("
         +z*d.x+","+z*d.y+")" } );
    // move labels
    l = doTr ? graphLabels.transition().duration(500) : graphLabels;
    l
  .attr("transform", function(d) { return "translate("
         +z*d.x+","+z*d.y+")" } );
  }


  /* --------------------------------------------------------------------- */
  /* Perform drag
   */
  function dragmove(d) {
    offset = { x : currentOffset.x + d3.event.dx,
               y : currentOffset.y + d3.event.dy };
    repositionGraph( offset, undefined, 'drag' );
  }


  /* --------------------------------------------------------------------- */
  /* Perform zoom. We do "semantic zoom", not geometric zoom
   * (i.e. nodes do not change size, but get spread out or stretched
   * together as zoom changes)
   */
  function doZoom( increment ) {
    newZoom = increment === undefined ? d3.event.scale
        : zoomScale(currentZoom+increment);
    if( currentZoom == newZoom )
      return;  // no zoom change

    // See if we cross the 'show' threshold in either direction
    if( currentZoom<SHOW_THRESHOLD && newZoom>=SHOW_THRESHOLD )
      svg.selectAll("g.label").classed('on',true);
    else if( currentZoom>=SHOW_THRESHOLD && newZoom<SHOW_THRESHOLD )
      svg.selectAll("g.label").classed('on',false);

    // See what is the current graph window size
    s = getViewportSize();
    width  = s.w<WIDTH  ? s.w : WIDTH;
    height = s.h<HEIGHT ? s.h : HEIGHT;

    // Compute the new offset, so that the graph center does not move
    zoomRatio = newZoom/currentZoom;
    newOffset = { x : currentOffset.x*zoomRatio + width/2*(1-zoomRatio),
                  y : currentOffset.y*zoomRatio + height/2*(1-zoomRatio) };

    // Reposition the graph
    repositionGraph( newOffset, newZoom, "zoom" );
  }

  zoomCall = doZoom;  // unused, so far

  /* --------------------------------------------------------------------- */

  /* process events from the force-directed graph */
  force.on("tick", function() {
    repositionGraph(undefined,undefined,'tick');
  });

  /* A small hack to start the graph with a movie pre-selected */
  if (selectedChar !== 'all') {
    clearAndSelect(idx[selectedChar]);
  } else {
    var mid = getQStringParameterByName('id')
    if( mid != null )
      clearAndSelect( mid );
  }
})();

} // end of D3ok()
