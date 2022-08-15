const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1wyql.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctors_portal").collection("services");
        const bookingCollection = client.db("doctors_portal").collection("booking");
        app.get('/', (req, res) => {
            res.send('hello');
        })
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray()
            res.send(service);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { patientEmail: email };
            const bookings = await bookingCollection.find(query).toArray();

            res.send(bookings);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;
            // Get all the services
            const services = await serviceCollection.find().toArray();

            // Get the bookings off that day 
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            // for each service
            services.forEach(service => {
                // find bookings for that service
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                // select slots for the service booking
                const bookedSlots = serviceBookings.map(book => book.slot);
                // select that slots that are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = available;
            })
            res.send(services)
        })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`port: ${port}`)
})