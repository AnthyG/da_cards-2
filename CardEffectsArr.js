let CardEffectsArr = {
    "Motivate 1": { // Typ/Name of the effect
        "description": "Motivates the Cards left and right, which gives them +1AP", // Description of the effect
        "roundsLeft": 3, // How many rotations this effect holds on (0 means instant, -1 forever)
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
    },
    "Blocker": {
        "description": "Forces all attacks on this Card",
        "roundsLeft": -1,
        "func": function(room, c1, p1, c2, p2) {}
    }
};

export default CardEffectsArr;