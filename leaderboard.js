const apiUrl = "https://gamebackendapi.onrender.com/" // Change if Flask API hosted elsewhere

async function loadLeaderboard() {
  try {
    const res = await fetch(`${apiUrl}/leaderboard`)
    const list = await res.json()
    const podium = document.getElementById("podium")
    podium.innerHTML = ""

    // Podium order: Silver (2nd), Gold (1st), Bronze (3rd)
    const podiumOrder = [
      { pos: 1, cls: "second", label: "🥈", place: "2nd" },
      { pos: 0, cls: "first", label: "🥇", place: "1st" },
      { pos: 2, cls: "third", label: "🥉", place: "3rd" }
    ]

    podiumOrder.forEach(({ pos, cls, label, place }) => {
      const person = list[pos]
      if (!person) return

      const positionDiv = document.createElement("div")
      positionDiv.className = `podium-position ${cls}`

      const rankDiv = document.createElement("div")
      rankDiv.className = "podium-rank"
      rankDiv.textContent = label

      const photo = document.createElement("img")
      photo.className = "podium-photo"
      photo.src = `${apiUrl}/images/${person.filename}`
      photo.alt = person.name
      photo.onerror = () => {
        photo.src = "/abstract-profile.png"
      }

      const nameDiv = document.createElement("div")
      nameDiv.className = "podium-name"
      nameDiv.textContent = person.name

      const scoreDiv = document.createElement("div")
      scoreDiv.className = "podium-score"
      scoreDiv.textContent = `${Math.round(person.elo)} pts`

      const baseDiv = document.createElement("div")
      baseDiv.className = "podium-base"
      baseDiv.textContent = place

      positionDiv.appendChild(rankDiv)
      positionDiv.appendChild(photo)
      positionDiv.appendChild(nameDiv)
      positionDiv.appendChild(scoreDiv)
      positionDiv.appendChild(baseDiv)

      podium.appendChild(positionDiv)
    })

    // Show other people below the podium
    const remainingList = list.filter((_, idx) => !podiumOrder.map(o => o.pos).includes(idx))
    let remainingSection = document.getElementById("remaining-ranks")
    let rankList = document.getElementById("rank-list")

    if (!remainingSection) {
      remainingSection = document.createElement("div")
      remainingSection.id = "remaining-ranks"
      remainingSection.className = "remaining-ranks"
      podium.parentNode.appendChild(remainingSection)
    }
    if (!rankList) {
      rankList = document.createElement("div")
      rankList.id = "rank-list"
      remainingSection.appendChild(rankList)
    }
    rankList.innerHTML = ""

    if (remainingList.length > 0) {
      remainingSection.style.display = "block"
      remainingSection.innerHTML = "<h2>Other Rankings</h2>"
      remainingSection.appendChild(rankList)
      remainingList.forEach((person, index) => {
        const rankItem = document.createElement("div")
        rankItem.className = "rank-item"

        const rankNumber = document.createElement("div")
        rankNumber.className = "rank-number"
        rankNumber.textContent = `#${index + 4}`

        const photo = document.createElement("img")
        photo.className = "rank-photo"
        photo.src = `${apiUrl}/images/${person.filename}`
        photo.alt = person.name
        photo.onerror = () => {
          photo.src = "/abstract-profile.png"
        }

        const info = document.createElement("div")
        info.className = "rank-info"

        const name = document.createElement("div")
        name.className = "rank-name"
        name.textContent = person.name

        const score = document.createElement("div")
        score.className = "rank-score"
        score.textContent = `Score: ${Math.round(person.elo)}`

        info.appendChild(name)
        info.appendChild(score)

        rankItem.appendChild(rankNumber)
        rankItem.appendChild(photo)
        rankItem.appendChild(info)

        rankList.appendChild(rankItem)
      })
    } else {
      remainingSection.style.display = "none"
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error)
    const podium = document.getElementById("podium")
    if (podium) {
      podium.innerHTML =
        '<div class="loading">Error loading leaderboard. Please try again.</div>'
    }
  }
}

// Initialize the leaderboard page
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard()
  setInterval(loadLeaderboard, 30000)
})