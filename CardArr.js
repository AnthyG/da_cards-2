let CardArr = {
    "King": {
        "type": "King",
        "animations": {
            "face": {
                "x_px": 9, // 495px
                "y_px": 6, // 510px
                "frameNr": 48
            },
            "bg": {
                "x_px": 1,
                "y_px": 1,
                "frameNr": 1
            }
        },
        "description": "The King.",
        "cid": null,
        "alreadyUsed": false,
        "roundsLeft": 10,
        "marked": false,
        "MPS": 5,
        "HP": 5,
        "AP": 2,
        "AT": "Physical",
        "effects": {
            "Motivate 1": 0
        }
    },
    "Queen": {
        "type": "Queen",
        "animations": {
            "face": {
                "x_px": 1, // 55px
                "y_px": 1, // 85px
                "frameNr": 1
            },
            "bg": {
                "x_px": 1,
                "y_px": 1,
                "frameNr": 1
            }
        },
        "frameNr": 1,
        "description": "The Queen.",
        "cid": null,
        "alreadyUsed": false,
        "roundsLeft": 10,
        "marked": false,
        "MPS": 5,
        "HP": 5,
        "AP": 2,
        "AT": "Physical",
        "effects": {
            "Motivate 2": 0
        }
    },
    "Dwarf": {
        "type": "Dwarf",
        "animations": {
            "face": {
                "x_px": 1, // 55px
                "y_px": 1, // 85px
                "frameNr": 1
            },
            "bg": {
                "x_px": 1,
                "y_px": 1,
                "frameNr": 1
            }
        },
        "description": "A Dwarf",
        "cid": null,
        "alreadyUsed": false,
        "roundsLeft": 4,
        "marked": false,
        "MPS": 2,
        "HP": 6,
        "AP": 3,
        "AT": "Physical",
        "effects": {
            "Blocker": 0
        }
    }
};

export default CardArr;