const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv')
dotenv.config()
const uri = process.env.MONGO_URI
const port = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("aimarena")
    const facilityCollection = db.collection("facilities")
    const bookingCollection = db.collection("bookings")

    //get all facility
    app.get("/facilities", async(req, res)=>{
      const result = await facilityCollection.find().toArray()
      res.send(result)
    })

    app.post("/facilities", async(req, res)=>{
        const facilities = req.body
        const result = await facilityCollection.insertOne(facilities)
        res.send(result)
    })

    //get details
    app.get("/facilities/:id", async(req, res)=>{
      const {id} = req.params
      const result = await facilityCollection.findOne({_id: new ObjectId(id)})
      res.send(result)
    })

    //getting booking data
    app.get("/bookings/:userId", async(req, res)=>{
      const {userId} = req.params
      const result = await bookingCollection.find({userId:userId}).toArray()
      res.send(result)
    })
    //for posting booking data
    app.post("/bookings", async(req, res)=>{
         const bookingData = req.body;
         const result = await bookingCollection.insertOne(bookingData)
         res.send(result)
    })
    //deleting booking data
    app.delete("/bookings/:bookingId", async(req, res)=>{
      const {bookingId} = req.params
      const result = await bookingCollection.deleteOne({_id: new ObjectId(bookingId)})
      res.send(result)
    })

    //getting owner facility
    app.get("/my-facilities/:email", async(req, res)=>{
      const {email} = req.params
      const result = await facilityCollection.find({ownerEmail: email}).toArray()
      res.send(result)
    })
    //deleting facility
     app.delete("/facilities/:id", async(req, res)=>{
      const {id} = req.params
      const result = await facilityCollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)

     })

     //update facility
     app.patch("/facilities/:id", async(req, res)=>{
      const {id} = req.params
      const updatedData = req.body
      const result = await facilityCollection.updateOne({_id: new ObjectId(id)},
    {
      $set: updatedData
    }
    )
    res.send(result)
     })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
