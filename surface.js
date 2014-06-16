
var verts = new Array();
var indices = new Array();

function createSurface(shape, spirit) {

    verts = new Array();
    indices = new Array();

    for (var i = 0; i < spirit.length; ++i) {
        createSectionAt(spirit, shape, i);
    }

    for (var i = 0 ; i < spirit.length - 1; ++i) {
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

function createSectionAt(spirit, shape, i) {

    //create plane base for the section
    var t = {x: 0, y: 0, z: 0};
    var v = {x: 0, y: 0, z: 0};
    var k = {x: 0, y: 0, z: 1};

    if (i === 0) {
        t.x = shape[1].x - shape[0].x;
        t.y = shape[1].y - shape[0].y;
    } else if (i === shape.length - 1) {
        t.x = shape[shape.length - 1].x - shape[shape.length - 2].x;
        t.y = shape[shape.length - 1].y - shape[shape.length - 2].y;
    } else {
        t.x = shape [i + 1].x - shape[i - 1].x;
        t.y = shape [i + 1].y - shape[i - 1].y;
    }
    
    norm = (Math.sqrt(t.x * t.x + t.y * t.y));
    t.x /= norm;
    t.y /= norm;
    t.z /= norm;

    v.x = t.y * k.z - t.z * k.y;
    v.y = t.z * k.x - t.x * k.z;
    v.z = t.x * k.y - t.y * k.x;

    for (var j = 0; j < shape.length; ++j) {
        var s = {x:0, y:0};
        s.x = shape[j].x / 380;
        s.y = shape[j].y / 500;
        
        var ame = {x:0, y:0};
        ame.x = spirit[i].x / 380;
        ame.y = spirit[i].y / 500;
        
        verts.push(ame.x + s.x * v.x);
        verts.push(ame.y + s.x * v.y);
        verts.push(s.y);
    }
}

function generateSurface() {
    createSurface(curve, curve);
//    for(var i = 0, len = verts.length; i < len; ++i) {
//        console.debug(verts[i]);
//    }
    
    for(var i = 0, len = indices.length / 3; i < len; ++i) {
        console.debug(indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]);
    }
    
    console.debug(verts.length);
    initBuffers(verts, indices);
}