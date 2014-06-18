
var verts = new Array();
var indices = new Array();
var normals = new Array();
var shapeNormals = new Array();

function createSurface(path, shape) {

    //create verts
    for (var i = 0; i < path.length; ++i) {
        createSectionAt(path, shape, i);
    }

    //triangulate faces
    for (var i = 0; i < path.length - 1; ++i) {
        for (var j = 0; j < shape.length - 1; ++j) {
            //first triangle
            indices.push(i * shape.length + j);
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);

            //second triangle
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);
        }
    }
}

function createSectionAt(path, shape, i) {

    //create plane base for the section
    var t = {x: 0, y: 0, z: 0};
    var v = {x: 0, y: 0, z: 0};
    var k = {x: 0, y: 0, z: 1};

    //speed vector
    if (i === 0) {
        if (pathCyclic) {
            t.x = path[1].x - path[path.length - 1].x;
            t.y = path[1].y - path[path.length - 1].y;
        } else {
            t.x = path[1].x - path[0].x;
            t.y = path[1].y - path[0].y;
        }
    } else if (i === path.length - 1) {
        if (pathCyclic) {
            t.x = path[1].x - path[path.length - 1].x;
            t.y = path[1].y - path[path.length - 1].y;
        } else {
            t.x = path[path.length - 1].x - path[path.length - 2].x;
            t.y = path[path.length - 1].y - path[path.length - 2].y;
        }
    } else {
        t.x = path [i + 1].x - path[i - 1].x;
        t.y = path [i + 1].y - path[i - 1].y;
    }

    norm = (Math.sqrt(t.x * t.x + t.y * t.y));
    t.x /= norm;
    t.y /= norm;
    t.z /= norm;

    v.x = t.y * k.z - t.z * k.y;
    v.y = t.z * k.x - t.x * k.z;
    v.z = t.x * k.y - t.y * k.x;

    //set vertices on plane whose normal is the speed vector
    for (var j = 0; j < shape.length; ++j) {
        var s = {x: 0, y: 0};
        s.x = shape[j].x / shapeCanvas.width - .5;
        s.y = shape[j].y / shapeCanvas.height - .5;

        var p = {x: 0, y: 0};
        p.x = path[i].x / pathCanvas.width - .5;
        p.y = path[i].y / pathCanvas.height - .5;

        verts.push(p.x + s.x * v.x);
        verts.push(p.y + s.x * v.y);
        verts.push(s.y);
    }
}

function generateLattice(shape, angle, steps) {

    var stepAngle = angle / steps;
    var currentAngle = 0;

    //generate sections
    for (var i = 0; i < steps + 1; ++i) {
        generateLatticeSection(shape, currentAngle);
        currentAngle += stepAngle;
    }

    //triangulate
    for (var i = 0; i < steps; ++i) {
        for (var j = 0, len = shape.length - 1; j < len; ++j) {
            //first triangle
            indices.push(i * shape.length + j);
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);

            //second triangle
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);
        }
    }
}

function generateLatticeSection(shape, angle) {

    var cosT = Math.cos(angle);
    var sinT = Math.sin(angle);

    for (var i = 0, len = shape.length; i < len; ++i) {
        var x = shape[i].x / shapeCanvas.width - .5;
        var y = shape[i].y / shapeCanvas.height - .5;

        verts.push(x * cosT);
        verts.push(x * sinT);
        verts.push(y);
    }
}

function simpleExtrusion(shape, ratio, length) {

    var steps = $("#steps").val();
    for (var i = 0; i < steps; ++i) {
        generateSimpleSectionAt(shape, i, ratio, length, steps - 1);
    }

    for (var i = 0; i < steps - 1; ++i) {
        for (var j = 0; j < shape.length - 1; ++j) {
            //first triangle
            indices.push(i * shape.length + j);
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);

            //second triangle
            indices.push(i * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j + 1);
            indices.push((i + 1) * shape.length + j);
        }
    }
}

function generateSimpleSectionAt(shape, i, ratio, length, steps) {

    var z = i * length / steps;
    var currentRatio = 1 - (i * ratio / steps);

    for (var j = 0, len = shape.length; j < len; ++j) {
        var s = {x: 0, y: 0};
        s.x = shape[j].x / shapeCanvas.width - .5;
        s.y = shape[j].y / shapeCanvas.height - .5;

        verts.push(s.x * currentRatio);
        verts.push(s.y * currentRatio);
        verts.push(z);
    }
}

function generateSurface() {

    verts = new Array();
    indices = new Array();
    normals = new Array();

    if ($("#bevel").is(":checked")) {
        createSurface(pathCurve, shapeCurve);

    } else if ($("#simple").is(":checked")) {
        var length = $("#length").val();
        var ratio = $("#ratio").val();
        simpleExtrusion(shapeCurve, ratio, length);

    } else if ($("#lattice").is(":checked")) {
        var angle = $("#angle").val() * 2 * Math.PI;
        var steps = $("#steps").val();
        generateLattice(shapeCurve, angle, steps);
    }
    initBuffers(verts, indices);
}

function updateSurface() {
    if ($("#editMode").is(":checked")) {
        generateSurface();
    }
}

$(document).ready(function() {
    $("#editMode").hide();
    $("#editModeLabel").hide();

    $("#generateSurface").click(function() {
        $("#editMode").show();
        $("#editModeLabel").show();
    });
});