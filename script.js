// Game State
const gameState = {
  currentPage: "entry",
  puzzleTiles: [],
  isComplete: false,
  timer: 0,
  timerInterval: null,
  secretCode: "INFYRA",
  selectedTile: null, // Added for tile swapping mechanism
}

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  initializeGame()
  setupEventListeners()
  setupMobileOptimizations()
})

function setupMobileOptimizations() {
  // Prevent zoom on double tap for iOS
  let lastTouchEnd = 0
  document.addEventListener(
    "touchend",
    (event) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    false,
  )

  // Prevent context menu on long press for mobile
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".puzzle-tile") || e.target.closest(".treasure-spot")) {
      e.preventDefault()
    }
  })

  // Add touch feedback for interactive elements
  const interactiveElements = document.querySelectorAll(".treasure-btn, .puzzle-tile, .treasure-spot, .venue-close")
  interactiveElements.forEach((element) => {
    element.addEventListener("touchstart", function () {
      this.style.opacity = "0.8"
    })
    element.addEventListener("touchend", function () {
      this.style.opacity = "1"
    })
    element.addEventListener("touchcancel", function () {
      this.style.opacity = "1"
    })
  })
}

function initializeGame() {
  showPage("entryPage")
  initializePuzzle()
}

function setupEventListeners() {
  // Entry page
  document.getElementById("startPuzzleBtn").addEventListener("click", startPuzzle)

  // Puzzle page
  document.getElementById("shuffleBtn").addEventListener("click", shufflePuzzle)

  // Treasure popup
  document.getElementById("unlockBtn").addEventListener("click", unlockTreasure)
  document.getElementById("secretCode").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      unlockTreasure()
    }
  })

  document.getElementById("playAgainBtn").addEventListener("click", playAgain)
  document.getElementById("exitBtn").addEventListener("click", exitGame)
  document.getElementById("treasureSpot").addEventListener("click", showVenuePopup)
  document.getElementById("closeVenueBtn").addEventListener("click", hideVenuePopup)

  document.getElementById("treasureSpot").addEventListener("touchstart", (e) => {
    e.preventDefault() // Prevent mouse events
    showVenuePopup()
  })
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page-container").forEach((page) => {
    page.classList.remove("active")
  })

  // Show target page
  document.getElementById(pageId).classList.add("active")
  gameState.currentPage = pageId

  if (window.innerWidth <= 768) {
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 100)
  }
}

function startPuzzle() {
  showPage("puzzlePage")
  startTimer()
  shufflePuzzle()
}

function initializePuzzle() {
  const puzzleGrid = document.getElementById("puzzleGrid")
  puzzleGrid.innerHTML = ""

  gameState.puzzleTiles = []

  // Create 9 tiles for 3x3 grid
  for (let i = 0; i < 9; i++) {
    const tile = {
      id: i,
      currentPosition: i,
      correctPosition: i,
    }
    gameState.puzzleTiles.push(tile)

    const tileElement = createTileElement(tile)
    puzzleGrid.appendChild(tileElement)
  }
}

function createTileElement(tile) {
  const tileDiv = document.createElement("div")
  tileDiv.className = "puzzle-tile"
  tileDiv.dataset.tileId = tile.id

  // Calculate background position for the tile (3x3 grid)
  const row = Math.floor(tile.correctPosition / 3)
  const col = tile.correctPosition % 3

  // Each tile is 33.333% of the image (100% / 3 = 33.333%)
  const bgPosX = col * 50 // -50% per column for 3x3
  const bgPosY = row * 50 // -50% per row for 3x3

  tileDiv.style.backgroundImage = "url(public/infyra-puzzle.png)"
  tileDiv.style.backgroundSize = "300% 300%" // 3x3 grid = 300%
  tileDiv.style.backgroundPosition = `-${bgPosX}% -${bgPosY}%`

  // Add tile number for reference
  const tileNumber = document.createElement("div")
  tileNumber.className = "tile-number"
  tileNumber.textContent = tile.id + 1
  tileDiv.appendChild(tileNumber)

  tileDiv.addEventListener("click", () => handleTileClick(tile))

  // Add touch events for mobile
  tileDiv.addEventListener("touchstart", function (e) {
    e.preventDefault() // Prevent mouse events
    this.style.transform = "scale(0.95)"
  })

  tileDiv.addEventListener("touchend", function (e) {
    e.preventDefault()
    this.style.transform = ""
    handleTileClick(tile)
  })

  tileDiv.addEventListener("touchcancel", function (e) {
    this.style.transform = ""
  })

  return tileDiv
}

function handleTileClick(clickedTile) {
  if (gameState.isComplete) return

  const tileElement = document.querySelector(`[data-tile-id="${clickedTile.id}"]`)

  if (!gameState.selectedTile) {
    // First tile selection
    gameState.selectedTile = clickedTile
    tileElement.style.border = "3px solid #daa520"
    tileElement.style.transform = "scale(1.05)"
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  } else if (gameState.selectedTile.id === clickedTile.id) {
    // Deselect the same tile
    gameState.selectedTile = null
    tileElement.style.border = "2px solid #654321"
    tileElement.style.transform = "scale(1)"
  } else {
    // Swap tiles
    swapTiles(gameState.selectedTile, clickedTile)

    // Reset selection styling
    document.querySelector(`[data-tile-id="${gameState.selectedTile.id}"]`).style.border = "2px solid #654321"
    document.querySelector(`[data-tile-id="${gameState.selectedTile.id}"]`).style.transform = "scale(1)"

    gameState.selectedTile = null
    updatePuzzleDisplay()
    checkCompletion()

    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
  }
}

function swapTiles(tile1, tile2) {
  const temp = tile1.currentPosition
  tile1.currentPosition = tile2.currentPosition
  tile2.currentPosition = temp
}

function updatePuzzleDisplay() {
  const puzzleGrid = document.getElementById("puzzleGrid")
  puzzleGrid.innerHTML = ""

  // Create array of 9 positions
  const positions = new Array(9).fill(null)

  // Place tiles in their current positions
  gameState.puzzleTiles.forEach((tile) => {
    positions[tile.currentPosition] = tile
  })

  // Render tiles in order
  positions.forEach((tile) => {
    const tileElement = createTileElement(tile)
    puzzleGrid.appendChild(tileElement)
  })
}

function shufflePuzzle() {
  // Disable button during shuffle
  const shuffleBtn = document.getElementById("shuffleBtn")
  shuffleBtn.disabled = true

  // Add shuffle animation
  document.getElementById("puzzleGrid").style.opacity = "0.5"

  setTimeout(() => {
    // Shuffle the positions randomly
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8]

    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    // Assign new positions to tiles
    gameState.puzzleTiles.forEach((tile, index) => {
      tile.currentPosition = positions[index]
    })

    updatePuzzleDisplay()
    gameState.isComplete = false
    document.getElementById("completionOverlay").classList.remove("show")

    // Re-enable button
    shuffleBtn.disabled = false
    document.getElementById("puzzleGrid").style.opacity = "1"
  }, 500)
}

function checkCompletion() {
  // This means tile 1 should be in position 0, tile 2 in position 1, etc.
  const targetArrangement = [1, 2, 3, 7, 9, 8, 4, 6, 5] // 1-based tile numbers

  // Create array to track current arrangement
  const currentArrangement = new Array(9)

  // Fill array with current tile positions (convert to 1-based)
  gameState.puzzleTiles.forEach((tile) => {
    currentArrangement[tile.currentPosition] = tile.id + 1 // Convert to 1-based
  })

  // Check if current arrangement matches target
  const isComplete = targetArrangement.every((targetTile, index) => {
    return currentArrangement[index] === targetTile
  })

  if (isComplete && !gameState.isComplete) {
    gameState.isComplete = true
    stopTimer()

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }

    // Add completion effects
    document.querySelectorAll(".puzzle-tile").forEach((tile) => {
      tile.classList.add("completed")
    })

    // Show completion overlay
    setTimeout(() => {
      document.getElementById("completionOverlay").classList.add("show")

      // Show treasure popup after delay
      setTimeout(() => {
        showTreasurePopup()
      }, 3000)
    }, 500)
  }
}

function startTimer() {
  gameState.timer = 0
  gameState.timerInterval = setInterval(() => {
    gameState.timer++
    updateTimerDisplay()
  }, 1000)
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval)
    gameState.timerInterval = null
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(gameState.timer / 60)
  const seconds = gameState.timer % 60
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`
  document.getElementById("timer").textContent = timeString
}

function showTreasurePopup() {
  const popup = document.getElementById("treasurePopup")
  popup.classList.add("show")

  setTimeout(() => {
    const secretCodeInput = document.getElementById("secretCode")
    if (secretCodeInput && window.innerWidth > 768) {
      secretCodeInput.focus()
    }
  }, 600)

  // Animate chest opening
  setTimeout(() => {
    document.querySelector(".treasure-chest").classList.add("opened")
  }, 500)
}

function unlockTreasure() {
  const inputCode = document.getElementById("secretCode").value.toUpperCase().trim()
  const errorMessage = document.getElementById("errorMessage")
  const inputSection = document.getElementById("treasureInput")
  const successMessage = document.getElementById("successMessage")

  if (inputCode === gameState.secretCode) {
    // Correct code
    errorMessage.classList.remove("show")
    inputSection.style.display = "none"
    successMessage.classList.add("show")

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

    setTimeout(() => {
      document.getElementById("treasurePopup").classList.remove("show")
      showPage("mapPage")
    }, 3000)
  } else {
    // Incorrect code
    errorMessage.classList.add("show")
    document.getElementById("secretCode").value = ""

    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300])
    }

    // Shake animation
    document.querySelector(".treasure-content").style.animation = "shake 0.5s ease-in-out"
    setTimeout(() => {
      document.querySelector(".treasure-content").style.animation = ""
    }, 500)

    // Hide error after delay
    setTimeout(() => {
      errorMessage.classList.remove("show")
    }, 3000)
  }
}

function showVenuePopup() {
  const popup = document.getElementById("venuePopup")
  popup.classList.add("show")

  if (navigator.vibrate) {
    navigator.vibrate(100)
  }
}

function hideVenuePopup() {
  const popup = document.getElementById("venuePopup")
  popup.classList.remove("show")
}

function playAgain() {
  // Reset game state
  gameState.isComplete = false
  gameState.timer = 0
  gameState.selectedTile = null
  stopTimer()

  // Reset UI
  document.getElementById("completionOverlay").classList.remove("show")
  document.getElementById("treasurePopup").classList.remove("show")
  document.getElementById("venuePopup").classList.remove("show")
  document.getElementById("treasureInput").style.display = "block"
  document.getElementById("successMessage").classList.remove("show")
  document.getElementById("secretCode").value = ""
  document.querySelector(".treasure-chest").classList.remove("opened")

  // Go back to entry page
  showPage("entryPage")

  // Reinitialize puzzle
  initializePuzzle()
}

function exitGame() {
  if (confirm("Are you sure you want to exit the game?")) {
    window.close()
  }
}

// Add some visual effects
function createFloatingParticles() {
  const particles = document.querySelector(".floating-particles")
  if (!particles) return

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement("div")
    particle.style.position = "absolute"
    particle.style.width = "3px"
    particle.style.height = "3px"
    particle.style.background = "#daa520"
    particle.style.borderRadius = "50%"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.top = Math.random() * 100 + "%"
    particle.style.animation = `float ${3 + Math.random() * 4}s ease-in-out infinite`
    particle.style.animationDelay = Math.random() * 2 + "s"
    particles.appendChild(particle)
  }
}

// Initialize floating particles
setTimeout(createFloatingParticles, 1000)

window.addEventListener("resize", () => {
  // Adjust puzzle grid size on orientation change
  if (gameState.currentPage === "puzzlePage") {
    setTimeout(() => {
      updatePuzzleDisplay()
    }, 100)
  }
})

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    if (gameState.currentPage === "puzzlePage") {
      updatePuzzleDisplay()
    }
    // Scroll to top after orientation change
    window.scrollTo(0, 0)
  }, 500)
})
