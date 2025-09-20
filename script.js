const apiUrl = "http://127.0.0.1:5000" // Flask API

async function loadRandom() {
  try {
    const photosDiv = document.getElementById("photos")
    photosDiv.classList.add("photos-loading")

    const res = await fetch(`${apiUrl}/photos/random`)
    const pair = await res.json()

    // ✅ Handle game over
    if (pair.done || !pair[0] || !pair[1]) {
      window.location.href = "leaderboard.html"
      return
    }

    photosDiv.innerHTML = ""

    // First photo
    const photo1Container = document.createElement("div")
    photo1Container.className = "photo-container"
    photo1Container.onclick = () => vote(pair[0].id, pair[1].id, photo1Container)

    const name1 = document.createElement("div")
    name1.className = "photo-name"
    name1.textContent = pair[0].name

    const img1 = document.createElement("img")
    img1.src = `${apiUrl}/images/${pair[0].filename}`
    img1.alt = pair[0].name

    photo1Container.appendChild(img1)
    photo1Container.appendChild(name1)

    // OR divider
    const orDivider = document.createElement("div")
    orDivider.className = "or-divider"
    orDivider.textContent = "OR"

    // Second photo
    const photo2Container = document.createElement("div")
    photo2Container.className = "photo-container"
    photo2Container.onclick = () => vote(pair[1].id, pair[0].id, photo2Container)

    const name2 = document.createElement("div")
    name2.className = "photo-name"
    name2.textContent = pair[1].name

    const img2 = document.createElement("img")
    img2.src = `${apiUrl}/images/${pair[1].filename}`
    img2.alt = pair[1].name

    photo2Container.appendChild(img2)
    photo2Container.appendChild(name2)

    // Add everything
    photosDiv.appendChild(photo1Container)
    photosDiv.appendChild(orDivider)
    photosDiv.appendChild(photo2Container)

    photosDiv.classList.remove("photos-loading")
  } catch (error) {
    console.error("Error loading photos:", error)
    document.getElementById("photos").innerHTML =
      '<div class="loading">Error loading photos. Please try again.</div>'
  }
}

async function vote(winner, loser, clickedElement) {
  try {
    // Click animation
    clickedElement.classList.add("clicked")

    await fetch(`${apiUrl}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner_id: winner, loser_id: loser }),
    })

    showVoteSuccess()

    setTimeout(() => {
      loadRandom()
    }, 600)
  } catch (error) {
    console.error("Error voting:", error)
    clickedElement.classList.remove("clicked")
  }
}

function showVoteSuccess() {
  const successMsg = document.createElement("div")
  successMsg.textContent = "Vote recorded! ✨"
  successMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 1.5rem 3rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 1.2rem;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: voteSuccess 2s ease-in-out;
    `

  if (!document.getElementById("vote-animation-style")) {
    const style = document.createElement("style")
    style.id = "vote-animation-style"
    style.textContent = `
            @keyframes voteSuccess {
                0% {opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);}
                20% {opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(5deg);}
                40% {transform: translate(-50%, -50%) scale(0.95) rotate(-2deg);}
                60% {transform: translate(-50%, -50%) scale(1.05) rotate(1deg);}
                80% {transform: translate(-50%, -50%) scale(1) rotate(0deg);}
                100% {opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(0deg);}
            }
        `
    document.head.appendChild(style)
  }

  document.body.appendChild(successMsg)
  setTimeout(() => {
    if (document.body.contains(successMsg)) {
      document.body.removeChild(successMsg)
    }
  }, 2000)
}

// Start game
document.addEventListener("DOMContentLoaded", () => {
  loadRandom()
})
