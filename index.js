const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async(req, res, next) =>{
  const authHeader = req?.headers.authorization
   if(!authHeader){
    return res.status(401).json({message: "Unauthorized"})
  }

  const token = authHeader.split(" ")[1]
  if(!token){
    return res.status(401).json({message: "Unauthorized"})
  }
  try{
    const {payload} = await jwtVerify(token, JWKS)
    next()
  }catch(error){
    return res.status(403).json({message: "Forbidden"})

  }

}
async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const db = client.db("aimarena")
    const facilityCollection = db.collection("facilities")
    const bookingCollection = db.collection("bookings")
   //featured cards
   app.get("/featured", async(req, res)=>{
     const result = await facilityCollection.find().limit(6).toArray()
     res.send(result)
   })
    //get all facility
    app.get("/facilities", async(req, res)=>{
      const {search, type} = req.query
      let query = {}
      if(search){
        query.facilityName = {$regex: search, $options: "i"}
      }
      if(type){
        query.type = type
      }
      const result = await facilityCollection.find(query).toArray()
      res.send(result)
    })

    app.post("/facilities", verifyToken, async(req, res)=>{
        const facilities = req.body
        const result = await facilityCollection.insertOne(facilities)
        res.send(result)
    })

    //get details
    app.get("/facilities/:id", verifyToken, async(req, res)=>{
      const {id} = req.params
      const result = await facilityCollection.findOne({_id: new ObjectId(id)})
      res.send(result)
    })

    //getting booking data
    app.get("/bookings/:userId", verifyToken, async(req, res)=>{
      const {userId} = req.params
      const result = await bookingCollection.find({userId:userId}).toArray()
      res.send(result)
    })
    //for posting booking data
    app.post("/bookings", verifyToken, async(req, res)=>{
         const bookingData = req.body;
         const result = await bookingCollection.insertOne(bookingData)
         res.send(result)
    })
    //deleting booking data
    app.delete("/bookings/:bookingId", verifyToken, async(req, res)=>{
      const {bookingId} = req.params
      const result = await bookingCollection.deleteOne({_id: new ObjectId(bookingId)})
      res.send(result)
    })

    //getting owner facility
    app.get("/my-facilities/:email", verifyToken, async(req, res)=>{
      const {email} = req.params
      const result = await facilityCollection.find({ownerEmail: email}).toArray()
      res.send(result)
    })
    //deleting facility
     app.delete("/facilities/:id", verifyToken, async(req, res)=>{
      const {id} = req.params
      const result = await facilityCollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)

     })

     //update facility
     app.patch("/facilities/:id", verifyToken, async(req, res)=>{
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
    //await client.db("admin").command({ ping: 1 });
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
