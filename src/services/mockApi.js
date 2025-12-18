export async function getGachas() {
  return fetch('/mock-db/gachas.json').then(r => r.json())
}

export async function getPrizesByGachaId(gachaId) {
  const prizes = await fetch('/mock-db/prizes.json').then(r => r.json())
  return prizes.filter(p => p.gacha_id === gachaId)
}
