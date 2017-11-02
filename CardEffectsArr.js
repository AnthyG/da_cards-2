let CardEffectsArr = {
    "Motivate 1": { // Typ/Name des Effekts
        "description": "Motivates the Cards left and right, which gives them +1AP", // Beschreibung des Effekts
        "roundsLeft": 3, // Wie viele Rotationen der Effekt noch anhält,
        "func": function(room, c1, p1, c2, p2) { // This Function requires the complete room-object (GID-......) and at least one card, and the player-nr to each card
            // ACCORDING TO WHAT THE EFFECT SHOULD DO, THE CODE IS DIFFERENT,.. (not obvious at all xD)
        }
    },
    "Motivate 2": {
        "description": "Motivates the Cards left and right, which gives them +2AP",
        "roundsLeft": 3,
        "func": function(room, c1, p1, c2, p2) {}
    },
    "Motivate 3": {
        "description": "Motivates the Cards left and right, which gives them +4AP",
        "roundsLeft": 3,
        "func": function(room, c1, p1, c2, p2) {}
    }
};

export default CardEffectsArr;