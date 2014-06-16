
var verts = new Array();
var indices = new Array();

function createSurface(path, shape) {

    verts = new Array();
    indices = new Array();

    for (var i = 0; i < path.length; ++i) {
        createSectionAt(path, shape, i);
    }

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

    if (i === 0) {
        t.x = path[1].x - path[0].x;
        t.y = path[1].y - path[0].y;
    } else if (i === path.length - 1) {
        t.x = path[path.length - 1].x - path[path.length - 2].x;
        t.y = path[path.length - 1].y - path[path.length - 2].y;
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

    for (var j = 0; j < shape.length; ++j) {
        var s = {x: 0, y: 0};
        s.x = shape[j].x / shapeCanvas.width - .5;
        s.y = shape[j].y / shapeCanvas.height - .5;

        var ame = {x: 0, y: 0};
        ame.x = path[i].x / pathCanvas.width - .5;
        ame.y = path[i].y / pathCanvas.height - .5;

        verts.push(ame.x + s.x * v.x);
        verts.push(ame.y + s.x * v.y);
        verts.push(s.y);
    }
}

function generateSurface() {
    createSurface(pathCurve, shapeCurve);
    initBuffers(verts, indices);
}