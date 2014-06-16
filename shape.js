//canvas
var shapeCanvas = document.getElementById('shape');
var shapeCtx = shapeCanvas.getContext('2d');
if (!shapeCtx) {
    alert("This page uses HTML 5 to render correctly.");
}
$(document).ready(function() {
    shape_drawBackground();
});

//interaction
var shapeDragging = false;
var shapePointIndex = 0;

//points & curve
var shapePoints = new Array();
var shapeKnots = new Array();
var shapeCurve;
var shapePreviousSeg;
var shapeP;

//options
var shapeFirstEndpoint = false;
var shapeLastEndpoint = false;
var shapeCyclic = false;
var shapeOrder = parseInt($("#shapeOrder").val());
var shapeResolution = parseInt($("#shapeResolution").val());

//display
var handleSize = 6;
var halfHandleSize = handleSize / 2;
var pointSize = 4;
var displayCurve = true;
var displayPoly = false;

function shape_drawBackground() {
    //bg
    shapeCtx.fillStyle = "rgb(15, 60, 100)";
    shapeCtx.fillRect(0, 0, shapeCanvas.width, shapeCanvas.height);

    //glow
    shapeCtx.arc(shapeCanvas.width / 2, shapeCanvas.height / 2, 1, 0, Math.PI * 2, false);
    shapeCtx.fillStyle = "rgba(50, 150, 255, 0)";
    shapeCtx.closePath();
    shapeCtx.shadowBlur = shapeCanvas.width;
    shapeCtx.shadowColor = "rgb(50, 150, 255)";
    shapeCtx.fill();

    //grid
    shapeCtx.shadowBlur = 0;
    shapeCtx.strokeStyle = "rgba(50, 150, 255, .25)";

    var stepX = shapeCanvas.width / 10;
    var currentX = 0;
    for (var i = 0; i < 10; ++i) {
        shapeCtx.beginPath();
        shapeCtx.moveTo(currentX, 0);
        shapeCtx.lineTo(currentX, shapeCanvas.height);
        shapeCtx.stroke();
        currentX += stepX;
    }
    
    shapeCtx.beginPath();
    shapeCtx.lineWidth = 2;
    shapeCtx.moveTo(shapeCanvas.width / 2, 0);
    shapeCtx.lineTo(shapeCanvas.width / 2, shapeCanvas.height);
    shapeCtx.stroke();

    var stepY = shapeCanvas.height / 10;
    var currentY = 0;
    for (var i = 0; i < 10; ++i) {
        shapeCtx.beginPath();
        shapeCtx.moveTo(0, currentY);
        shapeCtx.lineTo(shapeCanvas.width, currentY);
        shapeCtx.stroke();
        currentY += stepY;
    }

    shapeCtx.beginPath();
    shapeCtx.lineWidth = 2;
    shapeCtx.moveTo(0, shapeCanvas.height / 2);
    shapeCtx.lineTo(shapeCanvas.width, shapeCanvas.height / 2);
    shapeCtx.stroke();
    
    shapeCtx.lineWidth = 1;
}

function shape_draw() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    shape_drawBackground();

    if (displayPoly && shapePoints.length > 0) {
        shape_drawPoly(shapePoints, 1.5, "rgb(0, 0, 0)");
    }

    if (shapePoints.length > shapeOrder) {
        shape_drawPoly(shapeCurve, 1, "rgba(255, 255, 255, 1)");
    }

    if (shapePreviousSeg.length > 0) {
        shape_drawPoly(shapePreviousSeg, 1, "rgb(255, 0, 0)");
    }

    shape_drawPoints();
}

/**
 * 
 * @param {type} evt
 * @returns {x, y}
 */
function shape_getMousePos(evt) {
    var rect = shapeCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function shape_drawPoints() {
    shapeCtx.beginPath();
    shapeCtx.strokeStyle = "rgb(100, 100, 255)";
    shapeCtx.fillStyle = "rgba(100, 100, 200, .25)";

    for (i = 0; i < shapePoints.length; i++) {
        var point = shapePoints[i];
        shapeCtx.rect(point.x - halfHandleSize, point.y - halfHandleSize, handleSize, handleSize);
    }

    shapeCtx.stroke();
    shapeCtx.fill();
}

function shape_drawPointsAsCircles(pts) {
    shapeCtx.beginPath();
    shapeCtx.strokeStyle = "rgb(100, 100, 255)";
    shapeCtx.fillStyle = "rgba(100, 100, 200, .25)";

    for (i = 0; i < pts.length; i++) {
        var point = pts[i];
        shapeCtx.beginPath();
        shapeCtx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI, false);
        shapeCtx.stroke();
        shapeCtx.fill();
    }
}

function shape_drawPoly(poly, lineWidth, color) {
    shapeCtx.beginPath();
    shapeCtx.lineWidth = lineWidth;
    shapeCtx.strokeStyle = color;

    var point = poly[0];
    shapeCtx.moveTo(point.x, point.y);

    for (i = 1; i < poly.length; i++) {
        point = poly[i];
        shapeCtx.lineTo(point.x, point.y);
    }

    shapeCtx.stroke();
}

/**
 * @param {Array} poly
 * @param {int} t
 * @param {int} r
 * @returns {undefined}
 */
function shape_coxDeBoor(poly, t, r) {

    shapeP = new Array();
    shapeP.push(new Array());
    for (var i = r - shapeOrder; i <= r; ++i) {
        shapeP[0][i] = poly[i];
    }
    for (var j = 1; j <= shapeOrder; j++) {
        shapeP.push(new Array());
        for (var i = r - shapeOrder + j; i <= r; ++i) {
            var denominator = shapeKnots[i - j + shapeOrder + 1] - shapeKnots[i];


            var x = (t - shapeKnots[i]) * shapeP[j - 1][i].x + (shapeKnots[i - j + shapeOrder + 1] - t) * shapeP[j - 1][i - 1].x;
            var y = (t - shapeKnots[i]) * shapeP[j - 1][i].y + (shapeKnots[i - j + shapeOrder + 1] - t) * shapeP[j - 1][i - 1].y;

            x /= denominator;
            y /= denominator;

            var point = {x: x, y: y};

            shapeP[j][i] = point;
        }
    }

    return shapeP[shapeOrder][r];
}

function shape_processSubSpline(poly, r) {

    var tbegin = shapeKnots[r];
    var tend = shapeKnots[r + 1];
    var t = tbegin;
    var step = (tend - tbegin) / (shapeResolution - 1);
    var curveBegin = (r - shapeOrder) * shapeResolution;

    for (var i = 0; i < shapeResolution; ++i) {
        shapeCurve[i + curveBegin] = shape_coxDeBoor(poly, t, r);
        t += step;
    }
}

function shape_initKnots(poly) {

    var firstNodesCount = 0;
    var lastNodesCount = 0;
    var middleNodesCount;

    if (shapeFirstEndpoint) {
        firstNodesCount = shapeOrder;
    }
    if (shapeLastEndpoint) {
        lastNodesCount = shapeOrder + 1;
    }

    middleNodesCount = poly.length + 1 + shapeOrder - firstNodesCount - lastNodesCount;

    for (var i = 0; i < firstNodesCount; ++i) {
        shapeKnots.push(0);
    }

    for (var i = 0; i < middleNodesCount; ++i) {
        shapeKnots.push(i);
    }

    for (var j = 0; j < lastNodesCount; ++j) {
        shapeKnots.push(i);
    }
}

function shape_getPolyline(poly) {
    var polyline = new Array();
    for (var i = 0; i < poly.length; ++i)
        polyline.push(poly[i]);

    if (shapeCyclic) {
        for (var i = 0; i < shapeOrder; ++i) {
            polyline.push(poly[i]);
        }
    }

    return polyline;
}

function shape_processBsplineCurve(poly) {

    var polyline = shape_getPolyline(poly);

    var subcurves = polyline.length - shapeOrder;
    shapeCurve = new Array();

    //init nodes
    shapeKnots = new Array();
    shape_initKnots(polyline);

    //loop over each sub-spline
    for (var r = shapeOrder; r < subcurves + shapeOrder; ++r) {
        shape_processSubSpline(polyline, r);
    }
}

function shape_recalcCurve(poly, numPointShifted) {

    var polyline = shape_getPolyline(poly);

    var start = Math.max(numPointShifted, shapeOrder);
    var end = Math.min(numPointShifted + shapeOrder * 2, polyline.length);

    // sauvegarde de la courbe précédente
    if (shapePreviousSeg.length === 0)
        shapePreviousSeg = shapeCurve.slice((start - shapeOrder) * shapeResolution, (end - shapeOrder) * shapeResolution)

    //console.log("from : " + start + " to " + end);

    for (var range = start; range < end; ++range) {
        shape_processSubSpline(polyline, range);
    }
}

function delta(p1, p2) {
    return {
        x: p2.x - p1.x,
        y: p2.y - p1.y
    };
}

function getPointAt(p1, p2, t) {
    var diff = delta(p1, p2);
    return {
        x: diff.x * t + p1.x,
        y: diff.y * t + p1.y
    };
}

function shape_toggleDisplayCurve() {
    displayCurve = !displayCurve;
    shape_draw();
}

function shape_toggleDisplayPoly() {
    displayPoly = !displayPoly;
    shape_draw();
}

function shape_isCollidingHandle(point, handlePoint) {
    return point.x > handlePoint.x - halfHandleSize &&
            point.x < handlePoint.x + halfHandleSize &&
            point.y > handlePoint.y - halfHandleSize &&
            point.y < handlePoint.y + halfHandleSize;
}

$("#shape").mousedown(function(event) {
    point = shape_getMousePos(event);

    shapePreviousSeg = [];
    for (var i = 0; i < shapePoints.length; ++i) {
        if (shape_isCollidingHandle(point, shapePoints[i])) {
            switch (event.which) {
                case 1: // Left click
                    shapePointIndex = i;
                    shapeDragging = true;
                    break;
            }
            break;
        }
    }
});

$("#shape").mousemove(function(event) {
    if (shapeDragging) {
        point = shape_getMousePos(event);
        shapePoints[shapePointIndex] = point;
        if (shapePoints.length > shapeOrder) {
            shape_recalcCurve(shapePoints, shapePointIndex);
        }
        shape_draw();
    }
});

$("#shape").mouseup(function(event) {

    if (event.which === 3) // right click
        return;

    point = shape_getMousePos(event);
    if (shapeDragging) {
        shapePoints[shapePointIndex] = point;
        shapeDragging = false;
    }
    else {
        shapePoints.push(point);

        if (shapePoints.length > shapeOrder) {
            shape_processBsplineCurve(shapePoints);
        }
    }
    shape_draw();
});

$("#drawPolygon").change(function() {
    shape_toggleDisplayPoly();
});

$("#drawCurve").change(function() {
    shape_toggleDisplayCurve();
});

function shape_updateAll() {
    shape_processBsplineCurve(shapePoints);
    shape_draw();
}

function shape_updateOrder(o) {
    shapeOrder = o;
    shape_updateAll();
}

function shape_updateResolution(r) {
    shapeResolution = r;
    shape_updateAll();
}

$("#shapeFirst").change(function() {
    shapeFirstEndpoint = !shapeFirstEndpoint;

    if (shapeFirstEndpoint)
    {
        shapeCyclic = false;
        $("#shapeCyclic").attr("checked", shapeCyclic);
    }

    shape_updateAll();
});

$("#shapeLast").change(function() {
    shapeLastEndpoint = !shapeLastEndpoint;

    if (shapeLastEndpoint)
    {
        shapeCyclic = false;
        $("#shapeCyclic").attr("checked", shapeCyclic);
    }
    shape_updateAll();
});

$("#shapeCyclic").change(function() {
    shapeCyclic = !shapeCyclic;

    if (shapeCyclic)
    {
        shapeFirstEndpoint = shapeLastEndpoint = false;

        $("#shapeFirst").attr("checked", false);
        $("#shapeLast").attr("checked", false);
    }

    shape_updateAll();
});
