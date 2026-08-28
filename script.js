// ============================================
// INTERACTIVE VORONOI GENERATOR
// ============================================


// ============================================
// DOM ELEMENTS
// ============================================

const canvas =
  document.getElementById(
    "voronoiCanvas"
  );


const ctx =
  canvas.getContext(
    "2d"
  );


const app =
  document.querySelector(
    ".app"
  );


const pointSlider =
  document.getElementById(
    "pointSlider"
  );


const pointValue =
  document.getElementById(
    "pointValue"
  );


const pointStatus =
  document.getElementById(
    "pointStatus"
  );


const message =
  document.getElementById(
    "message"
  );


const undoBtn =
  document.getElementById(
    "undoBtn"
  );


const clearBtn =
  document.getElementById(
    "clearBtn"
  );


const randomBtn =
  document.getElementById(
    "randomBtn"
  );


const generateBtn =
  document.getElementById(
    "generateBtn"
  );


const modeButtons =
  document.querySelectorAll(
    ".mode-button[data-mode]"
  );


// ============================================
// WEIGHTED MODE ELEMENTS
// ============================================

const weightControls =
  document.getElementById(
    "weightControls"
  );


const weightSlider =
  document.getElementById(
    "weightSlider"
  );


const weightValue =
  document.getElementById(
    "weightValue"
  );


const selectedPointLabel =
  document.getElementById(
    "selectedPointLabel"
  );


const weightModeInputs =
  document.querySelectorAll(
    'input[name="weightMode"]'
  );


const totalWeightValue =
  document.getElementById(
    "totalWeightValue"
  );


// ============================================
// RELAX MODE ELEMENTS
// ============================================

const relaxControls =
  document.getElementById(
    "relaxControls"
  );


const iterationSlider =
  document.getElementById(
    "iterationSlider"
  );


const iterationValue =
  document.getElementById(
    "iterationValue"
  );


const speedSlider =
  document.getElementById(
    "speedSlider"
  );


const speedValue =
  document.getElementById(
    "speedValue"
  );


const iterationStatus =
  document.getElementById(
    "iterationStatus"
  );


const relaxBtn =
  document.getElementById(
    "relaxBtn"
  );


const resetRelaxBtn =
  document.getElementById(
    "resetRelaxBtn"
  );


// ============================================
// CANVAS SIZE
// ============================================

canvas.width = 900;

canvas.height = 600;


// ============================================
// STATE
// ============================================

let points = [];


let generated =
  false;


let currentMode =
  "basic";


let selectedPointIndex =
  null;


// ============================================
// WEIGHTING STATE
// ============================================

let weightMode =
  "additive";


// ============================================
// DYNAMIC DRAGGING
// ============================================

let draggingIndex =
  null;


let isDragging =
  false;


let didDrag =
  false;


// ============================================
// LLOYD RELAXATION STATE
// ============================================

let originalRelaxPoints =
  [];


let relaxationRunning =
  false;


let relaxationPaused =
  false;


let currentIteration =
  0;


let relaxationAnimationId =
  null;


// ============================================
// RANDOM COLOR
// ============================================

function generateColor() {

  return {

    hue:
      Math.floor(
        Math.random() * 360
      ),

    saturation:
      65,

    lightness:
      68

  };

}


// ============================================
// SUBTLE MULTIPLICATIVE WEIGHT
//
// Default = 5
// Small random deviation:
//
// 4.5 → 5.5
// ============================================

function getRandomMultiplicativeWeight() {

  const deviation =
    (Math.random() - 0.5)
    *
    1.0;


  return (
    5 + deviation
  );

}


// ============================================
// CREATE POINT
// ============================================

function createPoint(
  x,
  y
) {

  return {

    x: x,

    y: y,


    weight:

      weightMode ===
      "multiplicative"

        ?

        getRandomMultiplicativeWeight()

        :

        5,


    color:
      generateColor()

  };

}


// ============================================
// COPY POINTS
// ============================================

function copyPoints(
  sourcePoints
) {

  return sourcePoints.map(

    function(point) {

      return {

        x:
          point.x,

        y:
          point.y,

        weight:
          point.weight,

        color: {

          hue:
            point.color.hue,

          saturation:
            point.color.saturation,

          lightness:
            point.color.lightness

        }

      };

    }

  );

}


// ============================================
// UPDATE MAIN UI
// ============================================

function updateUI() {

  const maxPoints =
    Number(
      pointSlider.value
    );


  pointValue.textContent =
    maxPoints;


  pointStatus.textContent =
    `Placed: ${points.length} / ${maxPoints}`;


  undoBtn.disabled =

    points.length === 0

    ||

    relaxationRunning;


  clearBtn.disabled =

    points.length === 0

    ||

    relaxationRunning;


  generateBtn.disabled =
    points.length === 0;

}


// ============================================
// TOTAL WEIGHT
// ============================================

function getTotalWeight() {

  return points.reduce(

    function(
      total,
      point
    ) {

      return (
        total +
        point.weight
      );

    },

    0

  );

}


// ============================================
// UPDATE WEIGHT UI
// ============================================

function updateWeightUI() {

  if (
    currentMode !==
    "weighted"
  ) {

    weightControls.classList.add(
      "hidden"
    );

    return;

  }


  weightControls.classList.remove(
    "hidden"
  );


  if (
    selectedPointIndex === null
  ) {

    selectedPointLabel.textContent =
      "Click a seed point";


    weightSlider.disabled =
      true;


    weightValue.textContent =
      "-";


    totalWeightValue.textContent =
      getTotalWeight()
        .toFixed(2);


    return;

  }


  const point =
    points[
      selectedPointIndex
    ];


  selectedPointLabel.textContent =
    `Seed ${selectedPointIndex + 1}`;


  weightSlider.disabled =
    false;


  weightSlider.value =
    point.weight;


  if (

    weightMode ===
    "multiplicative"

  ) {

    weightValue.textContent =
      `${point.weight.toFixed(2)}×`;

  }

  else {

    weightValue.textContent =
      point.weight.toFixed(1);

  }


  totalWeightValue.textContent =
    getTotalWeight()
      .toFixed(2);

}


// ============================================
// UPDATE RELAX UI
// ============================================

function updateRelaxUI() {

  if (
    currentMode !==
    "relax"
  ) {

    relaxControls.classList.add(
      "hidden"
    );

    return;

  }


  relaxControls.classList.remove(
    "hidden"
  );


  const totalIterations =
    Number(
      iterationSlider.value
    );


  iterationValue.textContent =
    totalIterations;


  iterationStatus.textContent =
    `${currentIteration} / ${totalIterations}`;


  const speed =
    Number(
      speedSlider.value
    );


  if (
    speed < 34
  ) {

    speedValue.textContent =
      "Slow";

  }

  else if (
    speed < 67
  ) {

    speedValue.textContent =
      "Medium";

  }

  else {

    speedValue.textContent =
      "Fast";

  }


  if (
    relaxationRunning
  ) {

    relaxBtn.textContent =

      relaxationPaused

        ?

        "Resume"

        :

        "Pause";

  }

  else {

    relaxBtn.textContent =

      currentIteration >=
      totalIterations

        ?

        "Start Again"

        :

        "Start Relaxation";

  }


  resetRelaxBtn.disabled =
    relaxationRunning;

}


// ============================================
// CLEAR CANVAS
// ============================================

function clearCanvas() {

  ctx.clearRect(

    0,
    0,

    canvas.width,
    canvas.height

  );


  ctx.fillStyle =
    "#ffffff";


  ctx.fillRect(

    0,
    0,

    canvas.width,
    canvas.height

  );

}


// ============================================
// DRAW SEEDS
// ============================================

function drawPoints() {

  points.forEach(

    function(
      point,
      index
    ) {

      ctx.beginPath();


      ctx.arc(

        point.x,
        point.y,

        6,

        0,

        Math.PI * 2

      );


      ctx.fillStyle =
        `hsl(
          ${point.color.hue},
          ${point.color.saturation}%,
          ${point.color.lightness - 15}%
        )`;


      ctx.fill();


      ctx.lineWidth =

        index ===
        selectedPointIndex

          ?

          4

          :

          2;


      ctx.strokeStyle =

        index ===
        selectedPointIndex

          ?

          "#111318"

          :

          "#ffffff";


      ctx.stroke();


      ctx.fillStyle =
        "#111318";


      ctx.font =
        "bold 14px Arial";


      ctx.fillText(

        index + 1,

        point.x + 9,

        point.y - 9

      );

    }

  );

}


// ============================================
// REDRAW POINTS ONLY
// ============================================

function redrawPoints() {

  clearCanvas();

  drawPoints();

}


// ============================================
// DISTANCE SQUARED
// ============================================

function distanceSquared(

  x1,
  y1,

  x2,
  y2

) {

  const dx =
    x2 - x1;


  const dy =
    y2 - y1;


  return (

    dx * dx

    +

    dy * dy

  );

}


// ============================================
// GET WEIGHTED DISTANCE
// ============================================

function getWeightedDistance(

  x,
  y,

  point

) {

  const normalDistance =
    distanceSquared(

      x,
      y,

      point.x,
      point.y

    );


  // ------------------------------------------
  // BASIC / DYNAMIC / RELAX
  // ------------------------------------------

  if (

    currentMode === "basic"

    ||

    currentMode === "dynamic"

    ||

    currentMode === "relax"

  ) {

    return normalDistance;

  }


  // ------------------------------------------
  // WEIGHTED
  // ------------------------------------------

  if (
    currentMode === "weighted"
  ) {

    // ----------------------------------------
    // ADDITIVE WEIGHTED VORONOI
    // ----------------------------------------

    if (
      weightMode ===
      "additive"
    ) {

      return (

        normalDistance

        -

        point.weight
        *
        5000

      );

    }


    // ----------------------------------------
    // MULTIPLICATIVE WEIGHTED VORONOI
    //
    // Small differences in weight produce
    // subtle curved boundaries.
    // ----------------------------------------

    return (

      normalDistance

      /

      Math.max(
        point.weight,
        0.1
      )

    );

  }


  return normalDistance;

}


// ============================================
// FIND NEAREST SEED
// ============================================

function findNearestIndex(
  x,
  y
) {

  let nearestIndex =
    0;


  let shortestDistance =
    getWeightedDistance(

      x,
      y,

      points[0]

    );


  for (

    let i = 1;

    i < points.length;

    i++

  ) {

    const currentDistance =
      getWeightedDistance(

        x,
        y,

        points[i]

      );


    if (
      currentDistance <
      shortestDistance
    ) {

      shortestDistance =
        currentDistance;


      nearestIndex =
        i;

    }

  }


  return nearestIndex;

}


// ============================================
// HSL → RGB
// ============================================

function hslToRgb(
  h,
  s,
  l
) {

  s /= 100;

  l /= 100;


  const c =

    (
      1 -
      Math.abs(
        2 * l - 1
      )
    )

    *

    s;


  const x =

    c

    *

    (
      1 -

      Math.abs(
        ((h / 60) % 2) - 1
      )

    );


  const m =
    l - c / 2;


  let r = 0;

  let g = 0;

  let b = 0;


  if (h < 60) {

    r = c;

    g = x;

  }

  else if (h < 120) {

    r = x;

    g = c;

  }

  else if (h < 180) {

    g = c;

    b = x;

  }

  else if (h < 240) {

    g = x;

    b = c;

  }

  else if (h < 300) {

    r = x;

    b = c;

  }

  else {

    r = c;

    b = x;

  }


  return {

    r:
      Math.round(
        (r + m) * 255
      ),

    g:
      Math.round(
        (g + m) * 255
      ),

    b:
      Math.round(
        (b + m) * 255
      )

  };

}


// ============================================
// DRAW VORONOI
// ============================================

function drawVoronoi() {

  if (
    points.length === 0
  ) {

    redrawPoints();

    return;

  }


  const width =
    canvas.width;


  const height =
    canvas.height;


  const imageData =
    ctx.createImageData(
      width,
      height
    );


  const data =
    imageData.data;


  const colors =
    points.map(

      function(point) {

        return hslToRgb(

          point.color.hue,

          point.color.saturation,

          point.color.lightness

        );

      }

    );


  const ownership =
    new Uint8Array(
      width * height
    );


  // ==========================================
  // STEP 1
  // ASSIGN EVERY PIXEL
  // ==========================================

  for (

    let y = 0;

    y < height;

    y++

  ) {

    for (

      let x = 0;

      x < width;

      x++

    ) {

      const nearestIndex =
        findNearestIndex(
          x,
          y
        );


      const pixel =

        y * width

        +

        x;


      ownership[pixel] =
        nearestIndex;


      const color =
        colors[nearestIndex];


      const dataIndex =
        pixel * 4;


      data[dataIndex] =
        color.r;


      data[
        dataIndex + 1
      ] =
        color.g;


      data[
        dataIndex + 2
      ] =
        color.b;


      data[
        dataIndex + 3
      ] =
        255;

    }

  }


  // ==========================================
  // STEP 2
  // DETECT BOUNDARIES
  // ==========================================

  for (

    let y = 1;

    y < height - 1;

    y++

  ) {

    for (

      let x = 1;

      x < width - 1;

      x++

    ) {

      const pixel =

        y * width

        +

        x;


      const current =
        ownership[pixel];


      if (

        current !==
        ownership[pixel - 1]

        ||

        current !==
        ownership[pixel + 1]

        ||

        current !==
        ownership[pixel - width]

        ||

        current !==
        ownership[pixel + width]

      ) {

        const dataIndex =
          pixel * 4;


        data[dataIndex] =
          25;


        data[
          dataIndex + 1
        ] =
          25;


        data[
          dataIndex + 2
        ] =
          25;


        data[
          dataIndex + 3
        ] =
          255;

      }

    }

  }


  ctx.putImageData(

    imageData,

    0,
    0

  );


  drawPoints();

}


// ============================================
// CALCULATE VORONOI CENTROIDS
// ============================================

function calculateCentroids() {

  const width =
    canvas.width;


  const height =
    canvas.height;


  const count =
    points.length;


  const sumX =
    new Float64Array(
      count
    );


  const sumY =
    new Float64Array(
      count
    );


  const cellCount =
    new Uint32Array(
      count
    );


  for (

    let y = 0;

    y < height;

    y++

  ) {

    for (

      let x = 0;

      x < width;

      x++

    ) {

      const index =
        findNearestIndex(
          x,
          y
        );


      sumX[index] +=
        x;


      sumY[index] +=
        y;


      cellCount[index]++;

    }

  }


  return points.map(

    function(
      point,
      index
    ) {

      if (
        cellCount[index] === 0
      ) {

        return {

          x:
            point.x,

          y:
            point.y

        };

      }


      return {

        x:

          sumX[index]

          /

          cellCount[index],


        y:

          sumY[index]

          /

          cellCount[index]

      };

    }

  );

}


// ============================================
// GET ANIMATION DURATION
// ============================================

function getAnimationDuration() {

  const speed =
    Number(
      speedSlider.value
    );


  return (

    950

    -

    speed * 8

  );

}


// ============================================
// EASE IN OUT
// ============================================

function easeInOut(t) {

  return t < 0.5

    ?

    2 * t * t

    :

    1 -

    Math.pow(
      -2 * t + 2,
      2
    )

    /

    2;

}


// ============================================
// ANIMATE ONE RELAXATION STEP
// ============================================

function animateRelaxationStep(
  startPoints,
  targetCentroids
) {

  return new Promise(

    function(resolve) {

      const duration =
        getAnimationDuration();


      let startTime =
        performance.now();


      let pausedAt =
        null;


      function animate(now) {

        if (
          !relaxationRunning
        ) {

          resolve();

          return;

        }


        if (
          relaxationPaused
        ) {

          if (
            pausedAt === null
          ) {

            pausedAt =
              now;

          }


          relaxationAnimationId =
            requestAnimationFrame(
              animate
            );

          return;

        }


        if (
          pausedAt !== null
        ) {

          startTime +=
            now - pausedAt;


          pausedAt =
            null;

        }


        const elapsed =
          now - startTime;


        const progress =
          Math.min(

            elapsed / duration,

            1

          );


        const easedProgress =
          easeInOut(
            progress
          );


        points.forEach(

          function(
            point,
            index
          ) {

            point.x =

              startPoints[index].x

              +

              (

                targetCentroids[index].x

                -

                startPoints[index].x

              )

              *

              easedProgress;


            point.y =

              startPoints[index].y

              +

              (

                targetCentroids[index].y

                -

                startPoints[index].y

              )

              *

              easedProgress;

          }

        );


        drawVoronoi();


        if (
          progress < 1
        ) {

          relaxationAnimationId =
            requestAnimationFrame(
              animate
            );

        }

        else {

          resolve();

        }

      }


      relaxationAnimationId =
        requestAnimationFrame(
          animate
        );

    }

  );

}


// ============================================
// RUN LLOYD RELAXATION
// ============================================

async function runRelaxation() {

  if (
    points.length === 0
  ) {

    message.textContent =
      "Place at least one seed first.";

    return;

  }


  const totalIterations =
    Number(
      iterationSlider.value
    );


  if (
    currentIteration === 0
  ) {

    originalRelaxPoints =
      copyPoints(
        points
      );

  }


  relaxationRunning =
    true;


  relaxationPaused =
    false;


  updateRelaxUI();

  updateUI();


  while (

    currentIteration <
    totalIterations

    &&

    relaxationRunning

  ) {

    const startPoints =
      copyPoints(
        points
      );


    const centroids =
      calculateCentroids();


    await animateRelaxationStep(

      startPoints,

      centroids

    );


    if (
      !relaxationRunning
    ) {

      break;

    }


    currentIteration++;


    updateRelaxUI();


    message.textContent =
      `Relaxation iteration ${currentIteration} of ${totalIterations}.`;

  }


  if (

    currentIteration >=
    totalIterations

  ) {

    relaxationRunning =
      false;


    relaxationPaused =
      false;


    message.textContent =
      "Lloyd relaxation complete.";

  }


  updateRelaxUI();

  updateUI();

}


// ============================================
// STOP RELAXATION
// ============================================

function stopRelaxation() {

  relaxationRunning =
    false;


  relaxationPaused =
    false;


  if (
    relaxationAnimationId
  ) {

    cancelAnimationFrame(
      relaxationAnimationId
    );

  }


  relaxationAnimationId =
    null;

}


// ============================================
// SWITCH MODE
// ============================================

function switchMode(
  newMode
) {

  stopRelaxation();


  currentMode =
    newMode;


  generated =
    false;


  selectedPointIndex =
    null;


  modeButtons.forEach(

    function(button) {

      button.classList.remove(
        "active"
      );


      if (

        button.dataset.mode ===
        currentMode

      ) {

        button.classList.add(
          "active"
        );

      }

    }

  );


  app.classList.remove(

    "basic-mode",

    "dynamic-mode",

    "weighted-mode",

    "relax-mode"

  );


  app.classList.add(
    `${currentMode}-mode`
  );


  updateWeightUI();

  updateRelaxUI();


  if (
    currentMode === "basic"
  ) {

    redrawPoints();


    message.textContent =
      "Basic mode: place points, then generate the diagram.";

  }


  else if (
    currentMode === "dynamic"
  ) {

    if (
      points.length > 0
    ) {

      drawVoronoi();

    }

    else {

      clearCanvas();

    }


    message.textContent =
      "Dynamic mode: click to add seeds and drag them to reshape the diagram.";

  }


  else if (
    currentMode === "weighted"
  ) {

    if (
      points.length > 0
    ) {

      drawVoronoi();

    }

    else {

      clearCanvas();

    }


    message.textContent =
      "Weighted mode: select a seed and adjust its individual influence.";

  }


  else if (
    currentMode === "relax"
  ) {

    currentIteration =
      0;


    originalRelaxPoints =
      copyPoints(
        points
      );


    updateRelaxUI();


    if (
      points.length > 0
    ) {

      drawVoronoi();

    }

    else {

      clearCanvas();

    }


    message.textContent =
      "Relax mode: repeatedly move seeds toward their Voronoi cell centroids.";

  }


  updateUI();

}


// ============================================
// MODE BUTTONS
// ============================================

modeButtons.forEach(

  function(button) {

    button.addEventListener(

      "click",

      function() {

        switchMode(
          button.dataset.mode
        );

      }

    );

  }

);


// ============================================
// CANVAS POSITION
// ============================================

function getCanvasPosition(
  event
) {

  const rect =
    canvas.getBoundingClientRect();


  return {

    x:

      (
        event.clientX -
        rect.left
      )

      *

      (
        canvas.width /
        rect.width
      ),


    y:

      (
        event.clientY -
        rect.top
      )

      *

      (
        canvas.height /
        rect.height
      )

  };

}


// ============================================
// FIND SEED AT CURSOR
// ============================================

function findPointAtPosition(
  x,
  y
) {

  const grabRadius =
    14;


  for (

    let i =
      points.length - 1;

    i >= 0;

    i--

  ) {

    const point =
      points[i];


    const dx =
      x - point.x;


    const dy =
      y - point.y;


    if (

      dx * dx

      +

      dy * dy

      <=

      grabRadius *
      grabRadius

    ) {

      return i;

    }

  }


  return null;

}


// ============================================
// MOUSE DOWN
// ============================================

canvas.addEventListener(

  "mousedown",

  function(event) {

    if (
      relaxationRunning
    ) {

      return;

    }


    const position =
      getCanvasPosition(
        event
      );


    if (
      currentMode === "dynamic"
    ) {

      const pointIndex =
        findPointAtPosition(

          position.x,
          position.y

        );


      if (
        pointIndex !== null
      ) {

        draggingIndex =
          pointIndex;


        isDragging =
          true;


        didDrag =
          false;


        canvas.style.cursor =
          "grabbing";

      }

    }


    if (
      currentMode === "weighted"
    ) {

      const pointIndex =
        findPointAtPosition(

          position.x,
          position.y

        );


      if (
        pointIndex !== null
      ) {

        selectedPointIndex =
          pointIndex;


        updateWeightUI();


        drawVoronoi();

      }

    }

  }

);


// ============================================
// MOUSE MOVE
// ============================================

canvas.addEventListener(

  "mousemove",

  function(event) {

    if (

      currentMode !==
      "dynamic"

      ||

      !isDragging

      ||

      draggingIndex === null

    ) {

      return;

    }


    didDrag =
      true;


    const position =
      getCanvasPosition(
        event
      );


    points[
      draggingIndex
    ].x =
      position.x;


    points[
      draggingIndex
    ].y =
      position.y;


    drawVoronoi();

  }

);


// ============================================
// STOP DRAGGING
// ============================================

function stopDragging() {

  draggingIndex =
    null;


  isDragging =
    false;


  canvas.style.cursor =
    "crosshair";

}


canvas.addEventListener(
  "mouseup",
  stopDragging
);


canvas.addEventListener(
  "mouseleave",
  stopDragging
);


// ============================================
// CANVAS CLICK
// ============================================

canvas.addEventListener(

  "click",

  function(event) {

    if (
      relaxationRunning
    ) {

      return;

    }


    if (

      currentMode ===
      "dynamic"

      &&

      didDrag

    ) {

      didDrag =
        false;

      return;

    }


    if (

      currentMode ===
      "basic"

      &&

      generated

    ) {

      message.textContent =
        "Clear the canvas to place new seeds.";

      return;

    }


    const position =
      getCanvasPosition(
        event
      );


    if (
      currentMode ===
      "weighted"
    ) {

      const existingPoint =
        findPointAtPosition(

          position.x,
          position.y

        );


      if (
        existingPoint !== null
      ) {

        selectedPointIndex =
          existingPoint;


        updateWeightUI();


        drawVoronoi();

        return;

      }

    }


    const maxPoints =
      Number(
        pointSlider.value
      );


    if (

      points.length >=
      maxPoints

    ) {

      message.textContent =
        `Maximum of ${maxPoints} seeds reached.`;

      return;

    }


    points.push(

      createPoint(

        position.x,

        position.y

      )

    );


    if (
      currentMode ===
      "weighted"
    ) {

      selectedPointIndex =
        points.length - 1;


      updateWeightUI();

    }


    if (
      currentMode ===
      "relax"
    ) {

      originalRelaxPoints =
        copyPoints(
          points
        );


      currentIteration =
        0;


      updateRelaxUI();

    }


    if (
      currentMode ===
      "basic"
    ) {

      redrawPoints();

    }

    else {

      drawVoronoi();

    }


    updateUI();


    if (
      currentMode ===
      "weighted"
    ) {

      message.textContent =
        "Seed added. Adjust its influence from the control panel.";

    }

    else if (
      currentMode ===
      "relax"
    ) {

      message.textContent =
        "Seed added. Start relaxation when ready.";

    }

    else {

      message.textContent =
        "Continue placing seeds.";

    }

  }

);


// ============================================
// WEIGHT SLIDER
// ============================================

weightSlider.addEventListener(

  "input",

  function() {

    if (
      selectedPointIndex === null
    ) {

      return;

    }


    const value =
      Number(
        weightSlider.value
      );


    points[
      selectedPointIndex
    ].weight =
      value;


    updateWeightUI();


    drawVoronoi();

  }

);


// ============================================
// WEIGHT MODE
// ============================================

weightModeInputs.forEach(

  function(input) {

    input.addEventListener(

      "change",

      function() {

        if (
          !input.checked
        ) {

          return;

        }


        weightMode =
          input.value;


        // --------------------------------------
        // MULTIPLICATIVE
        //
        // Give every existing seed
        // a subtle random deviation.
        // --------------------------------------

        if (
          weightMode ===
          "multiplicative"
        ) {

          points.forEach(

            function(point) {

              point.weight =
                getRandomMultiplicativeWeight();

            }

          );

        }


        // --------------------------------------
        // ADDITIVE
        //
        // Restore default equal weights.
        // --------------------------------------

        else {

          points.forEach(

            function(point) {

              point.weight =
                5;

            }

          );

        }


        updateWeightUI();


        if (
          points.length > 0
        ) {

          drawVoronoi();

        }

      }

    );

  }

);


// ============================================
// ITERATION SLIDER
// ============================================

iterationSlider.addEventListener(

  "input",

  function() {

    const totalIterations =
      Number(
        iterationSlider.value
      );


    if (

      currentIteration >
      totalIterations

    ) {

      currentIteration =
        0;

    }


    updateRelaxUI();

  }

);


// ============================================
// SPEED SLIDER
// ============================================

speedSlider.addEventListener(

  "input",

  function() {

    updateRelaxUI();

  }

);


// ============================================
// RELAX BUTTON
// ============================================

relaxBtn.addEventListener(

  "click",

  function() {

    if (
      points.length === 0
    ) {

      message.textContent =
        "Place at least one seed first.";

      return;

    }


    if (
      relaxationRunning
    ) {

      relaxationPaused =
        !relaxationPaused;


      updateRelaxUI();

      return;

    }


    const totalIterations =
      Number(
        iterationSlider.value
      );


    if (

      currentIteration >=
      totalIterations

    ) {

      currentIteration =
        0;


      originalRelaxPoints =
        copyPoints(
          points
        );

    }


    runRelaxation();

  }

);


// ============================================
// RESET RELAXATION
// ============================================

resetRelaxBtn.addEventListener(

  "click",

  function() {

    if (
      relaxationRunning
    ) {

      return;

    }


    if (
      originalRelaxPoints.length === 0
    ) {

      return;

    }


    points =
      copyPoints(
        originalRelaxPoints
      );


    currentIteration =
      0;


    drawVoronoi();


    updateRelaxUI();


    message.textContent =
      "Seeds restored to their original positions.";

  }

);


// ============================================
// UNDO
// ============================================

undoBtn.addEventListener(

  "click",

  function() {

    if (
      points.length === 0
    ) {

      return;

    }


    points.pop();


    selectedPointIndex =
      null;


    if (
      currentMode ===
      "basic"
    ) {

      redrawPoints();

    }

    else {

      drawVoronoi();

    }


    if (
      currentMode ===
      "relax"
    ) {

      originalRelaxPoints =
        copyPoints(
          points
        );


      currentIteration =
        0;


      updateRelaxUI();

    }


    updateWeightUI();

    updateUI();


    message.textContent =
      "Latest seed removed.";

  }

);


// ============================================
// CLEAR
// ============================================

clearBtn.addEventListener(

  "click",

  function() {

    stopRelaxation();


    points = [];


    generated =
      false;


    selectedPointIndex =
      null;


    originalRelaxPoints =
      [];


    currentIteration =
      0;


    clearCanvas();


    updateWeightUI();

    updateRelaxUI();

    updateUI();


    message.textContent =
      "Canvas cleared. Click to place seeds.";

  }

);


// ============================================
// GENERATE
// ============================================

generateBtn.addEventListener(

  "click",

  function() {

    if (
      points.length === 0
    ) {

      message.textContent =
        "Place at least one seed first.";

      return;

    }


    generated =
      true;


    message.textContent =
      "Generating Voronoi diagram...";


    setTimeout(

      function() {

        drawVoronoi();


        message.textContent =
          "Voronoi diagram generated.";

      },

      20

    );

  }

);


// ============================================
// RANDOM POINTS
// ============================================

function generateRandomPoints(
  numberOfPoints
) {

  points = [];


  for (

    let i = 0;

    i < numberOfPoints;

    i++

  ) {

    points.push(

      createPoint(

        Math.random()
        *
        canvas.width,


        Math.random()
        *
        canvas.height

      )

    );

  }

}


// ============================================
// RANDOM BUTTON
// ============================================

randomBtn.addEventListener(

  "click",

  function() {

    stopRelaxation();


    const numberOfPoints =
      Number(
        pointSlider.value
      );


    generateRandomPoints(
      numberOfPoints
    );


    generated =
      currentMode ===
      "basic";


    selectedPointIndex =
      null;


    currentIteration =
      0;


    originalRelaxPoints =
      copyPoints(
        points
      );


    updateWeightUI();

    updateRelaxUI();

    updateUI();


    drawVoronoi();


    if (
      currentMode ===
      "weighted"
    ) {

      message.textContent =

        weightMode ===
        "multiplicative"

          ?

          "Multiplicative weighted Voronoi created with subtle random seed influence."

          :

          "Weighted Voronoi created. Select a seed to adjust its influence.";

    }

    else if (
      currentMode ===
      "dynamic"
    ) {

      message.textContent =
        "Dynamic Voronoi created. Drag any seed to reshape it.";

    }

    else if (
      currentMode ===
      "relax"
    ) {

      message.textContent =
        "Random Voronoi created. Start Lloyd relaxation when ready.";

    }

    else {

      message.textContent =
        `Random Voronoi generated with ${numberOfPoints} seeds.`;

    }

  }

);


// ============================================
// POINT SLIDER
// ============================================

pointSlider.addEventListener(

  "input",

  function() {

    const newMaximum =
      Number(
        pointSlider.value
      );


    if (

      points.length >
      newMaximum

    ) {

      points =
        points.slice(

          0,

          newMaximum

        );


      selectedPointIndex =
        null;


      if (
        currentMode ===
        "basic"
      ) {

        redrawPoints();

      }

      else {

        drawVoronoi();

      }


      message.textContent =
        "Excess seeds removed because the maximum was reduced.";

    }


    if (
      currentMode ===
      "relax"
    ) {

      originalRelaxPoints =
        copyPoints(
          points
        );


      currentIteration =
        0;


      updateRelaxUI();

    }


    generated =
      false;


    updateWeightUI();

    updateUI();

  }

);


// ============================================
// INITIAL STATE
// ============================================

clearCanvas();

updateUI();

updateWeightUI();

updateRelaxUI();