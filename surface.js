
var verts = new Array();
var indices = new Array();

function createSurface(shape, spirit) {

    verts = new Array();
    indices = new Array();

    for (var i = 0; i < spirit.length; ++i) {
        createSectionAt(sprit, shape, i);
    }

    for (var i = 0 ; i < spirit.length - 1; ++i) {
        for (var j = 0; j < shape.length - 1; ++j) {
            //first triangle
            indices.push(j);
            indices.push(j + 1);
            indices.push(i + j);
            
            //second triangle
            indices.push(j);
            indices.push(i + j + 1);
            indices.push(j + 1);
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
        t.x = shape[length - 1].x - shape[length - 2].x;
        t.y = shape[length - 1].y - shape[length - 2].y;
    } else {
        t.x = shape [i + 1].x - shape[i - 1].x;
        t.y = shape [i + 1].y - shape[i - 1].y;
    }

    t /= (sqrt(pow(t.x, 2) + pow(t.y, 2)));

    v.x = t.y * k.z - t.z * k.y;
    v.y = t.z * k.x - t.x * k.z;
    v.z = t.x * k.y - t.y * k.x;

    for (var j = 0; j < shape.length; ++j) {
        verts.push({x: spirit[i].x + shape[j].x * v.x,
                    y: spirit[i].y + shape[j].y * v.y,
                    z: shape[j].z
        });
    }
}