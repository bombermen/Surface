//canvas
var pathCanvas = document.getElementById('path');
var pathCtx = pathCanvas.getContext('2d');
if (!pathCtx) {
    alert("This page uses HTML 5 to render correctly.");
}
$(document).ready(function() {
    path_drawBackground();
});

//interaction
var pathDragging = false;
var pathPointIndex = 0;

//points & curve
var pathPoints = new Array();
var pathKnots = new Array();
var pathCurve;
var pathPreviousSeg;
var pathP;

//options
var pathFirstEndpoint = false;
var pathLastEndpoint = false;
var pathCyclic = false;
var pathOrder = parseInt($("#pathOrder").val());
var pathResolution = parseInt($("#pathResolution").val());

//display
var handleSize = 6;
var halfHandleSize = handleSize / 2;
var pointSize = 4;
var displayCurve = true;
var displayPoly = false;

function path_drawBackground() {
    //bg
    pathCtx.fillStyle = "rgb(15, 60, 100)";
    pathCtx.fillRect(0, 0, pathCanvas.width, pathCanvas.height);

    //glow
    pathCtx.arc(pathCanvas.width / 2, pathCanvas.height / 2, 1, 0, Math.PI * 2, false);
    pathCtx.fillStyle = "rgba(50, 150, 255, 0)";
    pathCtx.closePath();
    pathCtx.shadowBlur = pathCanvas.width;
    pathCtx.shadowColor = "rgb(50, 150, 255)";
    pathCtx.fill();

    //grid
    pathCtx.shadowBlur = 0;
    pathCtx.strokeStyle = "rgba(50, 150, 255, .25)";

    var stepX = pathCanvas.width / 10;
    var currentX = 0;
    for (var i = 0; i < 10; ++i) {
        pathCtx.beginPath();
        pathCtx.moveTo(currentX, 0);
        pathCtx.lineTo(currentX, pathCanvas.height);
        pathCtx.stroke();
        currentX += stepX;
    }
    
    pathCtx.beginPath();
    pathCtx.lineWidth = 2;
    pathCtx.moveTo(pathCanvas.width / 2, 0);
    pathCtx.lineTo(pathCanvas.width / 2, pathCanvas.height);
    pathCtx.stroke();

    var stepY = pathCanvas.height / 10;
    var currentY = 0;
    for (var i = 0; i < 10; ++i) {
        pathCtx.beginPath();
        pathCtx.moveTo(0, currentY);
        pathCtx.lineTo(pathCanvas.width, currentY);
        pathCtx.stroke();
        currentY += stepY;
    }

    pathCtx.beginPath();
    pathCtx.lineWidth = 2;
    pathCtx.moveTo(0, pathCanvas.height / 2);
    pathCtx.lineTo(pathCanvas.width, pathCanvas.height / 2);
    pathCtx.stroke();
    
    pathCtx.lineWidth = 1;
}

function path_draw() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    path_drawBackground();

    if (displayPoly && pathPoints.length > 0) {
        path_drawPoly(pathPoints, 1.5, "rgb(0, 0, 0)");
    }

    if (pathPoints.length > pathOrder) {
        path_drawPoly(pathCurve, 1, "rgba(255, 255, 255, 1)");
    }

    if (pathPreviousSeg.length > 0) {
        path_drawPoly(pathPreviousSeg, 1, "rgb(255, 0, 0)");
    }

    path_drawPoints();
}

/**
 * 
 * @param {type} evt
 * @returns {x, y}
 */
function path_getMousePos(evt) {
    var rect = pathCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function path_drawPoints() {
    pathCtx.beginPath();
    pathCtx.strokeStyle = "rgb(100, 100, 255)";
    pathCtx.fillStyle = "rgba(100, 100, 200, .25)";

    for (i = 0; i < pathPoints.length; i++) {
        var point = pathPoints[i];
        pathCtx.rect(point.x - halfHandleSize, point.y - halfHandleSize, handleSize, handleSize);
    }

    pathCtx.stroke();
    pathCtx.fill();
}

function path_drawPointsAsCircles(pts) {
    pathCtx.beginPath();
    pathCtx.strokeStyle = "rgb(100, 100, 255)";
    pathCtx.fillStyle = "rgba(100, 100, 200, .25)";

    for (i = 0; i < pts.length; i++) {
        var point = pts[i];
        pathCtx.beginPath();
        pathCtx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI, false);
        pathCtx.stroke();
        pathCtx.fill();
    }
}

function path_drawPoly(poly, lineWidth, color) {
    pathCtx.beginPath();
    pathCtx.lineWidth = lineWidth;
    pathCtx.strokeStyle = color;

    var point = poly[0];
    pathCtx.moveTo(point.x, point.y);

    for (i = 1; i < poly.length; i++) {
        point = poly[i];
        pathCtx.lineTo(point.x, point.y);
    }

    pathCtx.stroke();
}

/**
 * @param {Array} poly
 * @param {int} t
 * @param {int} r
 * @returns {undefined}
 */
function path_coxDeBoor(poly, t, r) {

    pathP = new Array();
    pathP.push(new Array());
    for (var i = r - pathOrder; i <= r; ++i) {
        pathP[0][i] = poly[i];
    }
    for (var j = 1; j <= pathOrder; j++) {
        pathP.push(new Array());
        for (var i = r - pathOrder + j; i <= r; ++i) {
            var denominator = pathKnots[i - j + pathOrder + 1] - pathKnots[i];


            var x = (t - pathKnots[i]) * pathP[j - 1][i].x + (pathKnots[i - j + pathOrder + 1] - t) * pathP[j - 1][i - 1].x;
            var y = (t - pathKnots[i]) * pathP[j - 1][i].y + (pathKnots[i - j + pathOrder + 1] - t) * pathP[j - 1][i - 1].y;

            x /= denominator;
            y /= denominator;

            var point = {x: x, y: y};

            pathP[j][i] = point;
        }
    }

    return pathP[pathOrder][r];
}

function path_processSubSpline(poly, r) {

    var tbegin = pathKnots[r];
    var tend = pathKnots[r + 1];
    var t = tbegin;
    var step = (tend - tbegin) / (pathResolution - 1);
    var curveBegin = (r - pathOrder) * pathResolution;

    for (var i = 0; i < pathResolution; ++i) {
        pathCurve[i + curveBegin] = path_coxDeBoor(poly, t, r);
        t += step;
    }
}

function path_initKnots(poly) {

    var firstNodesCount = 0;
    var lastNodesCount = 0;
    var middleNodesCount;

    if (pathFirstEndpoint) {
        firstNodesCount = pathOrder;
    }
    if (pathLastEndpoint) {
        lastNodesCount = pathOrder + 1;
    }

    middleNodesCount = poly.length + 1 + pathOrder - firstNodesCount - lastNodesCount;

    for (var i = 0; i < firstNodesCount; ++i) {
        pathKnots.push(0);
    }

    for (var i = 0; i < middleNodesCount; ++i) {
        pathKnots.push(i);
    }

    for (var j = 0; j < lastNodesCount; ++j) {
        pathKnots.push(i);
    }
}

function path_getPolyline(poly) {
    var polyline = new Array();
    for (var i = 0; i < poly.length; ++i)
        polyline.push(poly[i]);

    if (pathCyclic) {
        for (var i = 0; i < pathOrder; ++i) {
            polyline.push(poly[i]);
        }
    }

    return polyline;
}

function path_processBsplineCurve(poly) {

    var polyline = path_getPolyline(poly);

    var subcurves = polyline.length - pathOrder;
    pathCurve = new Array();

    //init nodes
    pathKnots = new Array();
    path_initKnots(polyline);

    //loop over each sub-spline
    for (var r = pathOrder; r < subcurves + pathOrder; ++r) {
        path_processSubSpline(polyline, r);
    }
}

function path_recalcCurve(poly, numPointShifted) {

    var polyline = path_getPolyline(poly);

    var start = Math.max(numPointShifted, pathOrder);
    var end = Math.min(numPointShifted + pathOrder * 2, polyline.length);

    // sauvegarde de la courbe précédente
    if (pathPreviousSeg.length === 0)
        pathPreviousSeg = pathCurve.slice((start - pathOrder) * pathResolution, (end - pathOrder) * pathResolution)

    //console.log("from : " + start + " to " + end);

    for (var range = start; range < end; ++range) {
        path_processSubSpline(polyline, range);
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

function path_toggleDisplayCurve() {
    displayCurve = !displayCurve;
    path_draw();
}

function path_toggleDisplayPoly() {
    displayPoly = !displayPoly;
    path_draw();
}

function path_isCollidingHandle(point, handlePoint) {
    return point.x > handlePoint.x - halfHandleSize &&
            point.x < handlePoint.x + halfHandleSize &&
            point.y > handlePoint.y - halfHandleSize &&
            point.y < handlePoint.y + halfHandleSize;
}

$("#path").mousedown(function(event) {
    point = path_getMousePos(event);

    pathPreviousSeg = [];
    for (var i = 0; i < pathPoints.length; ++i) {
        if (path_isCollidingHandle(point, pathPoints[i])) {
            switch (event.which) {
                case 1: // Left click
                    pathPointIndex = i;
                    pathDragging = true;
                    break;
            }
            break;
        }
    }
});

$("#path").mousemove(function(event) {
    if (pathDragging) {
        point = path_getMousePos(event);
        pathPoints[pathPointIndex] = point;
        if (pathPoints.length > pathOrder) {
            path_recalcCurve(pathPoints, pathPointIndex);
        }
        path_draw();
    }
});

$("#path").mouseup(function(event) {

    if (event.which === 3) // right click
        return;

    point = path_getMousePos(event);
    if (pathDragging) {
        pathPoints[pathPointIndex] = point;
        pathDragging = false;
    }
    else {
        pathPoints.push(point);

        if (pathPoints.length > pathOrder) {
            path_processBsplineCurve(pathPoints);
        }
    }
    path_draw();
});

$("#drawPolygon").change(function() {
    path_toggleDisplayPoly();
});

$("#drawCurve").change(function() {
    path_toggleDisplayCurve();
});

function path_updateAll() {
    path_processBsplineCurve(pathPoints);
    path_draw();
}

function path_updateOrder(o) {
    pathOrder = o;
    path_updateAll();
}

function path_updateResolution(r) {
    pathResolution = r;
    path_updateAll();
}

$("#pathFirst").change(function() {
    pathFirstEndpoint = !pathFirstEndpoint;

    if (pathFirstEndpoint)
    {
        pathCyclic = false;
        $("#pathCyclic").attr("checked", pathCyclic);
    }

    path_updateAll();
});

$("#pathLast").change(function() {
    pathLastEndpoint = !pathLastEndpoint;

    if (pathLastEndpoint)
    {
        pathCyclic = false;
        $("#pathCyclic").attr("checked", pathCyclic);
    }
    path_updateAll();
});

$("#pathCyclic").change(function() {
    pathCyclic = !pathCyclic;

    if (pathCyclic)
    {
        pathFirstEndpoint = pathLastEndpoint = false;

        $("#pathFirst").attr("checked", false);
        $("#pathLast").attr("checked", false);
    }

    path_updateAll();
});
