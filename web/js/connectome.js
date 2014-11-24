// Here is the size of the canvas, and the radius for the visualization
var w = 1800,
    h = 1800,
    rx = w / 2 - 150,
    ry = h / 2 - 150,
    m0,
    rotate = 0;

var splines = [];

// Here is a function to specify the ordering
// We compare the "order" varaible between the two nodes
function comparator(a, b) {
    return d3.ascending(a.order, b.order);
}

// The clustering layout will sort the data based on the "order" variable, HOWEVER (this is important!)
// if you specify groupings (Eg in name R-1.1, R-1 is a group) that break apart this ordering, it will
// be broken.
var cluster = d3.layout.cluster()
    .size([360, ry - 200])
    .sort(comparator);
    

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85) // this tension determines the spacing and extent of the edges into the circle
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

// Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
var div = d3.select("fullNetwork").insert("div", "h2")
    .attr("id","svg-canvas")
    .style("top", "80px")
    .style("left", "80px")
    .style("width", w + "px")
    .style("height", w + "px")
    .style("position", "absolute")
    .style("-webkit-backface-visibility", "hidden");

var svg = div.append("svg:svg")
    .attr("width", w)
    .attr("height", w)
    .attr("xmlns","http://www.w3.org/2000/svg")
    .attr("version",1.1)
    .append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")");

svg.append("svg:path")
    .attr("class", "arc")
    .style("fill","#fff")
    .attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
    .on("mousedown", mousedown);

// Here is a funcion to get variables from the URL - the code script name
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

//Get json name from the browser url
var json_data = getUrlVars()

if (typeof json_data["data"] == 'undefined'){ json_data = "mean_corrdata";}
else { json_data = json_data["data"].replace("/",""); }

d3.json("data/" + json_data + ".json", function(classes) {
  var classcounts = packages.count(classes);
  
  var nodes = cluster.nodes(packages.root(classes,classcounts.centroids)),
      // Links will have source, target, and value (strength) of correlation
      links = packages.connections(nodes),
      splines = bundle(links);
         
  // This variable could determine if the current svg view should
  // be frozen, which can be done with a click
  // var freeze = "on";

  var path = svg.selectAll("path.link")
      .data(links)
      .enter().append("svg:path")
        .attr("class", function(d) { 
         if (d.value > 0) {var direction = "up"}
         else {var direction = "down"}
         return "link source-" + d.source.key + " direction-" + direction + " target-" + d.target.key; })
        .attr("d", function(d, i) { return line(splines[i]); })
        // These attributes are very important to saving - they must be defined here 
        // or else saving the shot of the svg will not include them, and you will
        // create a monster!
        .style("stroke-opacity",0.2)
        .style("fill","none")
        .style("stroke",function(d){
          // Here we add a variable, "value" to class of node to distinguish if its positive or negative
          var direction;
          if (d.value > 0) {return "red";}
          else {return "#7AA6FE";}
        })
     

  // We want to only print the label for networks when we are seeing
  // them for the first time.  Other "donut" methods text looks too hideous, so 
  // I am trying this!
  var textlabels = []   

  svg.selectAll("g.node")
      .data(nodes.filter(function(n) { return !n.children; }))
        .enter().append("svg:g")
        .attr("class", "node")
        .style("font-size",18)
        .attr("id", function(d) { return "node-" + d.key; })
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    .append("svg:text")
      .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
      .attr("dy", ".8em")
      .attr("fill",function(d) { 
          if (d.network == "L Cingulo-opercular") {return "#000000";}
          if (d.network == "R Cingulo-opercular") {return "#000000";}
          else return d.color; })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
      .text(function(d) { 
         // Find the last node
         if (d.makelabel == 0) {return "";}
         else return d.network;
       })
      
   
    svg.selectAll("g.node")
        .append("svg:circle")
          .attr("r",4)
          .attr("fill",function(d) {return d.color})   
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)

      // Show image of roi when mouse over node
      .on("mouseover.image",function(node){
        // Add the image
        d3.select("#imageBox")
          .selectAll("img")
          .attr("src", "img/" + node.image)

          // Add the xyz coordinates
          d3.select("#x").text(node.xcoord.toFixed(2))
          d3.select("#y").text(node.ycoord.toFixed(2))
          d3.select("#z").text(node.z.toFixed(2))
      })
      // Show title of network when mouse over node
      .on("mouseover.title",function(d) { 
         d3.select("#titleBox")
          .selectAll("h3")
          .text(d.network);})
     

  // Here is slider to adjust the tension   
  d3.select("input[type=range]").on("change", function() {
    line.tension(this.value / 100);
    path.attr("d", function(d, i) { return line(splines[i]); });
  });
});

d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

function mouse(e) {
  return [e.pageX - rx, e.pageY - ry];
}

function mousedown() {
  m0 = mouse(d3.event);
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
    div.style("-webkit-transform", "translateY(" + (ry - rx) + "px)rotateZ(" + dm + "deg)translateY(" + (rx - ry) + "px)");
  }
}

function mouseup() {
  if (m0) {
    var m1 = mouse(d3.event),
        dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

    rotate += dm;
    if (rotate > 360) rotate -= 360;
    else if (rotate < 0) rotate += 360;
    m0 = null;

    div.style("-webkit-transform", null);

    svg
      .attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
      .selectAll("g.node text")
        .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 8 : -8; })
        .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
  }
}
// Here is where we should modify the coloring of the nodes!
function mouseover(d) {
  svg.selectAll("path.link.target-" + d.key)
        .attr('stroke-width', 8)
        .style("stroke-opacity", 1);
  
  svg.selectAll("path.link.source-" + d.key)
      .attr('stroke-width', 8)
      .style("stroke-opacity", 1);
      
}

function mouseout(d) {
  svg.selectAll("path.link.source-" + d.key)
             .attr('stroke-width',3)
             .style("stroke-opacity", 0.2);

  svg.selectAll("path.link.target-" + d.key)
       .attr('stroke-width',3)
        .style("stroke-opacity", 0.2);

}

function updateNodes(name, value) {
  return function(d) {
    if (value) this.parentNode.appendChild(this);
    svg.select("#node-" + d[name].key).classed(name, value);
  };
}

function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

//Vanessa's Hacky save svg function!
function save_svg(evt) {
    var svg = document.getElementsByTagName("svg");
    var serializer = new XMLSerializer();
    var svg_blob = new Blob([serializer.serializeToString(svg[0])],
                            {'type': "image/svg+xml"});
    var url = URL.createObjectURL(svg_blob);
    var svg_win = window.open(url, "svg_win");
}


//Highlight all positive node connections
document.getElementById('highlight_positive').onchange = function() {
    if ( document.getElementById('highlight_positive').checked === true ) {
       d3.selectAll("path.link.direction-up")        
      .attr("stroke-width",8);
    }
    else {
      d3.selectAll("path.link.direction-up")        
      .attr("stroke-width",3);
    }
}


document.getElementById('highlight_negative').onchange = function() {
    if ( document.getElementById('highlight_negative').checked === true ) {
       d3.selectAll("path.link.direction-down")        
      .attr("stroke-width",8);
    }
    else {
      d3.selectAll("path.link.direction-down")        
      .attr("stroke-width",3);
    }

}
