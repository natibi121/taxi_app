const express = require('express')
const app = express()
const ObjectId = require("mongodb").ObjectId;

function getClient(){
    const { MongoClient, ServerApiVersion } = require('mongodb');
    const uri = "mongodb+srv://testUser1:lkOk2HtL0dhcCzFv@cluster0.djt6uol.mongodb.net/?retryWrites=true&w=majority";
    return new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
}

const path = require('path');

app.get('/', function (req, res){
    res.sendFile(path.join(__dirname, 'views','home.html'));
});

app.use(express.static('public'));

app.get('/cars', function (req, res) {
    const client = getClient();
    client.connect(async err => {
        const collection = client.db("taxi_app").collection("cars");
        //licenseNumber === 'DFG-345'
        const cars = await collection
        .find()
        .limit(2)
        .sort({hourlyRate: 1})
        .toArray();
        res.send(cars)
        client.close();
    });
})

function getId(raw){
    try{
        return new ObjectId(raw);
    }catch (err){
        return "";
    }
}

app.get('/cars/:id', function(req, res){

    const id = getId(req.params.id);
    console.log(id);
    if(!id){
        res.send({error: 'invalid id'});
        return
    }

    const client = getClient();
    client.connect(async (err) => {
        const collection = client.db("taxi_app").collection("cars");
        const car = await collection.findOne({_id: id});
        if(!car){
            res.send({error: 'not found'});
            return
        }
        res.send(car)
        client.close();
    });
});

app.delete('/cars/:id', function(req, res){
    const id = getId(req.params.id);
    console.log(id);
    if(!id){
        res.send({error: 'invalid id'});
        return
    }

    const client = getClient();
    client.connect(async (err) => {
        const collection = client.db("taxi_app").collection("cars");
        const result = await collection.deleteOne({_id: id});
        if(!result.deletedCount){
            res.send({error: 'not found'});
            return
        }
        res.send({id: req.params.id  })
        client.close();
    });
});

const bodyParser = require('body-parser');

app.put('/cars/:id', bodyParser.json(),function(req, res){
    const updatedCar = {
        name: req.body.name,
        licenseNumber: req.body.licenseNumber,
        hourlyRate: req.body.hourlyRate,
    }

    const id = getId(req.params.id);
    if(!id){
        res.send({error: 'invalid id'});
        return
    }

    const client = getClient();
    client.connect(async (err) => {
        const collection = client.db("taxi_app").collection("cars");
        const result = await collection.findOneAndUpdate({_id: id}, {$set: updatedCar});

        if(!result.ok){
            res.send({error: 'not found'});
            return
        }
        res.send(result.value)
        client.close();
    });
});

app.post('/cars', bodyParser.json(),function(req, res){
    const newCar = {
        name: req.body.name,
        licenseNumber: req.body.licenseNumber,
        hourlyRate: req.body.hourlyRate,
        trips: []
    }

    const client = getClient();
    client.connect(async (err) => {
        const collection = client.db("taxi_app").collection("cars");
        const car = await collection.insertOne(newCar);
        if(!result.insertedCount){
            res.send({error: 'insert error'});
            return
        }
        res.send(updatedCar)
        client.close();
    });
});

app.post('/trips', bodyParser.json(), function(req, res){
    const newTrip = {
        numberOfMinutes: req.body.numberOfMinutes,
        date: Math.floor(Date.now() / 1000),
    };
    const id = getId(req.body.carId);
    if(!id){
        res.send({error: 'invalid id'});
        return
    };

    const client = getClient();
    client.connect(async (err) => {
        const collection = client.db("taxi_app").collection("cars");
        const result = await collection.findOneAndUpdate(
            {_id: id},
            {$push: {trips: newTrip}},
            {returnOriginal: false}
        );

        if(!result.ok){
            res.send({error: 'not found'});
            return
        }
        res.send(result.value)
        client.close();
    });
})

app.listen(3000)