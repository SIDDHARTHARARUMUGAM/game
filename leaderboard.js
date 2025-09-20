const apiUrl = "https://gamebackendapi.onrender.com/" // Change if Flask API hosted elsewhere

async function loadLeaderboard() {
  try {
    const res = await fetch(`${apiUrl}/leaderboard`)
    const list = await res.json()
    const leaderboard = document.getElementById("leaderboard")
    leaderboard.innerHTML = ""

    list.forEach((person, index) => {
      const item = document.createElement("div")
      item.className = "leaderboard-item"

      const rank = document.createElement("div")
      rank.className = "rank"
      if (index === 0) rank.classList.add("gold")
      else if (index === 1) rank.classList.add("silver")
      else if (index === 2) rank.classList.add("bronze")
      rank.textContent = `#${index + 1}`

      const photoDiv = document.createElement("div")
      const photo = document.createElement("img")
      photo.className = "leaderboard-photo"
      photo.src = `${apiUrl}/images/${person.filename}`
      photo.alt = person.name
      photo.onerror = () => {
        photo.src = "/abstract-profile.png"
      }
      photoDiv.appendChild(photo)

      const name = document.createElement("div")
      name.className = "name"
      name.textContent = person.name

      const score = document.createElement("div")
      score.className = "score"
      score.textContent = `${Math.round(person.elo)}`

      item.appendChild(rank)
      item.appendChild(photoDiv)
      item.appendChild(name)
      item.appendChild(score)

      leaderboard.appendChild(item)
    })
  } catch (error) {
    console.error("Error loading leaderboard:", error)
    document.getElementById("leaderboard").innerHTML =
      '<div class="loading">Error loading leaderboard. Please try again.</div>'
  }
}

// Initialize the leaderboard page
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard()

  // Auto-refresh leaderboard every 30 seconds
  setInterval(loadLeaderboard, 30000)
})
