inventory = []

class Places:
    def __init__(self, name, north=None, east=None, south=None, west=None, contents=None, describe="", look="", **kwargs):
        self.name = name
        self.north = north
        self.east = east
        self.south = south
        self.west = west
        self.contents = contents
        self.describe = describe
        for key, value in kwargs.items():
            setattr(self, key, value)

House = Places(
    "House",
    contents="key",
    describe="Gimbo is in the house. Gimbo want to have adventure.",
    look="Gimbo see door to south, and locked door to east. There is also on ground key."
)
Shed = Places(
    "Shed",
    contents="TNT bundle",
    describe="There is small shed with some red sticks on big shelf.",
    reach="The red sticks is too high up for Gimbo arms. Gimbo can't reach."
)
Path = Places(
    "Path",
    contents="rock",
    describe="Gimbo on path. There is small fence keeping grass from yellow dirt.",
    listen="Gimbo can hear bird chirping."
    look="Gimbo see path to north, and gate to south. There is also rock on ground."
)
Meadow = Places(
    "Meadow",
    contents="rabbit",
    describe="You are in a meadow. A white rabbit pokes its head out from the grass. There is a forest to the east.",
    listen="You can hear water flowing from the south.",
    look ="Gimbo see meadow with many flowers. There is path to west, and forest to east. Gimbo also see river bank to south."
)
Forest = Places(
    "Forest",
    contents=["stick", "beehive"],
    describe="Gimbo in a forest. Many tree and much green to be seen. Gimbo feel great."
    look="Gimbo see forest with many trees. There is meadow to west, and river bank to south. Gimbo also see sticks on ground and beehive on tree."
    listen="Bees go buzz buzz, very funny."
)
RiverBank = Places(
    "RiverBank",
    contents="flint",
    describe="Gimbo is on bank of river. Cool water run by, and Gimbo see shiny on other side."
    look = "Gimbo see fish swimming in river, and a shiny on other side. "
)
Mountain = Places(
    "Mountain",
    contents=None,
    describe="Gimbo is at base of big rock. Gimbo see big hole in rock to the west."
)
Cave = Places(
    "Cave",
    contents="torch",
    describe="Gimbo sees tunnel to North, and small upside down foxes on roof.",
    boom="BOOM!, upside down foxy all flap away from tunnel. Gimbo ear hurt"
)
TunnelExit = Places(
    "TunnelExit",
    contents="boulder",
    describe="Gimbo at end of tunnel. There is big rock block Gimbo's way.",
    boom="Big rock gone! Gimbo see light at end of tunnel!"
)
Exit = Places(
    "Exit",
    contents=None,
    describe="Big grass! Big tree! Time to find new home for Rabbit and Me!"
)

House.south = Path
House.east = Shed
Shed.west = House
Path.north = House
Meadow.east = Forest
Meadow.south = RiverBank
Meadow.west = Mountain
Forest.west = Meadow
RiverBank.north = Meadow
Mountain.east = Meadow
Mountain.west = Cave
Cave.north = TunnelExit
Cave.east = Mountain
TunnelExit.south = Cave
TunnelExit.east = Exit
Exit.west = TunnelExit




def showInstructions():
    print('''
Gimbo's Adventure
=================
Commands:
  go [direction]
  get [item]

''')




currentPlace = House


def where():
    print(f"You are now in the {currentPlace}")  
def were():
    print(f"You are in the {currentPlace}")  


#rooms = {"Hall": {"south": "Kitchen",
                  #"item": "key"},
         #"Kitchen": {"north": "Hall",
                    #"item": "bacon"}}





directions = Places[currentPlace]["south"]

showInstructions()





while True:
    were()
    move = input(">")
    move = move.split(" ", 1)
 
    if move[0] == "go":
        if move[1] in Places[currentPlace]:
            currentPlace = Places[currentPlace][move[1]]
        else:
            print(f"You can't go {move[1]}!")
    
    
    
    
    
    
    
    
class Place:
    def __init__(self, name, item=None):
        self.name = name
        self.item = item

    def take_item(self):
        item = self.item
        self.item = None
        return item


class Player:
    def __init__(self):
        self.inventory = []

    def get(self, item_name, current_place: Place):
        if item_name == current_place.item:
            item = current_place.take_item()
            self.inventory.append(item)
            print(f"You got a {item}!")
            print(self.inventory)
        else:
            print(f"I can't see a {item_name} here!")
