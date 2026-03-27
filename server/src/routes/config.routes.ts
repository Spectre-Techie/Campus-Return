import { Router } from "express";

export const configRouter: ReturnType<typeof Router> = Router();

// Cache the campus data in memory -- it's static
let campusData: unknown = null;

configRouter.get("/buildings", (_req, res) => {
  if (!campusData) {
    campusData = {
      buildings: [
        {
          id: "library", name: "Main Library",
          zones: [
            { id: "library-entrance", name: "Entrance Hall" },
            { id: "library-reading", name: "Reading Area" },
            { id: "library-computer", name: "Computer Lab" },
            { id: "library-study", name: "Study Rooms" },
          ],
        },
        {
          id: "science", name: "Science Building",
          zones: [
            { id: "science-lobby", name: "Main Lobby" },
            { id: "science-lab", name: "Laboratories" },
            { id: "science-lecture", name: "Lecture Halls" },
          ],
        },
        {
          id: "engineering", name: "Engineering Block",
          zones: [
            { id: "engineering-lobby", name: "Main Lobby" },
            { id: "engineering-workshop", name: "Workshop" },
            { id: "engineering-lab", name: "Computer Lab" },
            { id: "engineering-lecture", name: "Lecture Halls" },
          ],
        },
        {
          id: "cafeteria", name: "Cafeteria",
          zones: [
            { id: "cafeteria-indoor", name: "Indoor Seating" },
            { id: "cafeteria-outdoor", name: "Outdoor Area" },
            { id: "cafeteria-counter", name: "Counter / Queue" },
          ],
        },
        {
          id: "admin", name: "Administration",
          zones: [
            { id: "admin-reception", name: "Reception" },
            { id: "admin-offices", name: "Offices" },
            { id: "admin-hallway", name: "Hallways" },
          ],
        },
        {
          id: "sports", name: "Sports Complex",
          zones: [
            { id: "sports-field", name: "Sports Field" },
            { id: "sports-gym", name: "Gymnasium" },
            { id: "sports-locker", name: "Locker Rooms" },
            { id: "sports-stands", name: "Spectator Stands" },
          ],
        },
        {
          id: "hostel", name: "Student Hostel",
          zones: [
            { id: "hostel-lobby", name: "Lobby" },
            { id: "hostel-common", name: "Common Room" },
            { id: "hostel-corridor", name: "Corridors" },
            { id: "hostel-laundry", name: "Laundry Area" },
          ],
        },
        {
          id: "parking", name: "Parking Lot",
          zones: [
            { id: "parking-main", name: "Main Lot" },
            { id: "parking-bike", name: "Bike Stands" },
            { id: "parking-entrance", name: "Entrance Gate" },
          ],
        },
      ],
      categories: [
        { id: "electronics", name: "Electronics", icon: "Smartphone" },
        { id: "books", name: "Books & Notes", icon: "BookOpen" },
        { id: "clothing", name: "Clothing", icon: "Shirt" },
        { id: "accessories", name: "Accessories", icon: "Watch" },
        { id: "keys", name: "Keys", icon: "Key" },
        { id: "bags", name: "Bags & Wallets", icon: "Briefcase" },
        { id: "id-cards", name: "ID Cards & Documents", icon: "CreditCard" },
        { id: "other", name: "Other", icon: "Package" },
      ],
    };
  }

  res.json({ status: "success", data: campusData });
});
