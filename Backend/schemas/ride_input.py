from pydantic import BaseModel

class RideInput(BaseModel):
    Pickup_Location: str
    Drop_Location: str
    Ride_Type: str
    Event: str