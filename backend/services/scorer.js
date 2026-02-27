function calculateScore(predictions) {
  const PENALTIES = {
    "pothole": 15,
    "Pothole": 15,
    "alligator cracking": 10,
    "Alligator cracking": 10,
    "crack": 5,
    "Crack": 5,
    "weathering": 3,
    "Weathering": 3
  };

  let totalPenalty = 0;
  
  predictions.forEach(defect => {
    const penalty = PENALTIES[defect.class] || 5;
    totalPenalty += penalty;
  });

  const score = Math.max(0, 100 - totalPenalty);
  
  const status = score >= 80 ? "Good"
               : score >= 50 ? "Moderate"
               : "Critical";

  return { score, status };
}

module.exports = { calculateScore };
