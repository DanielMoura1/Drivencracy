import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import axios from 'axios';
import joi from 'joi'
import { MongoClient,ObjectId } from "mongodb";
const app = express();
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
const conexao = mongoClient.connect();


app.post("/poll", async (req, res) => {
    const poll = req.body;
    const validador = joi.object({
        title: joi.string().required(),
        expireAt: joi.required()
       
      });
      const validar = validador.validate(poll)
      if(validar.error){
        res.status(422).send('messages não tá legal  -_-')
        return;
      }
    if(poll.expireAt==""){
        
        const data =new Date()
        
        const priorDate = new Date().setDate(data.getDate() + 30) 
        poll.expireAt = priorDate
        console.log(priorDate)
    }
        try{
            await db.collection("poll").insertOne(poll);
        } catch(e){
            res.sendStatus(500);
        }
    
    console.log(poll)
    res.send(201);
})
app.get("/poll", async (req, res) => {
    try{
        const poll = await db.collection("poll").find().toArray()
        console.log(poll)
        res.send(201);
    } catch(e){
        res.sendStatus(500);
    }

})

app.post("/choice", async (req, res) => {
    const choice = req.body;
   
    try{
        const teste = await db.collection("choice").findOne({title: choice.title})
        if(teste){
            res.sendStatus(409);
            return
        }
        await db.collection("choice").insertOne(choice);
        console.log(choice.pollId)
       
        const usuario = await db.collection("poll").findOne({_id: ObjectId(choice.pollId)})
        const escolha = await db.collection("choice").findOne({title: choice.title})
        console.log(usuario)
        console.log('usuario')
        console.log(escolha)
        console.log('escolha')
        const votos ={
            createdAt: usuario.expireAt, 
	        choiceId: escolha._id
          
        }
        console.log(votos)
        
        await db.collection("vote").insertOne(votos);
        console.log('votos')
        res.send(201);
    } catch(e){
        res.sendStatus(500);
    }
})
app.get("/poll/:id/choice", async (req, res) => {
    const id = req.params.id;
    try{
        console.log(id)
        const usuario = await db.collection("poll").findOne({_id:ObjectId(id)})
        if(!usuario){
            res.sendStatus(404);
        }
        const escolha = await db.collection("choice").find({pollId:id}).toArray()
        console.log(escolha)
        res.send(escolha);
    } catch(e){
        console.log(e)
        res.sendStatus(500);
    
    }

})
app.post("/choice/:id/vote", async (req, res) => {
    const id = req.params.id;
    try{
        console.log('usuario')
        const escolha = await db.collection("choice").findOne({_id: ObjectId(id)})

        const usuario = await db.collection("poll").findOne({_id:ObjectId(escolha.pollId)})
        
        console.log(usuario)
        console.log('usuario')
        console.log(escolha)
        console.log('escolha')
        const votos ={
            createdAt: new Date(), 
	        choiceId: id
          
        }
        
        await db.collection("vote").insertOne(votos);
    
        console.log(votos)
        console.log('vote2')
        res.send(201);

    }catch(e){
        console.log(e)
        res.sendStatus(500);
    
    }
})

app.get("/poll/:id/result", async (req, res) => {
    const id = req.params.id;
    try{
        const escolha = await db.collection("choice").find({pollId: id}).toArray()
        const vote = await db.collection("vote").find().toArray()

        
     let num=0
     let ress={}
        const a = escolha.map((es)=>{
           
            ress={}
            let valor =0
            let num=0
          
            for(let i=0;i<vote.length;i++){
              
                
                console.log(vote[i].choiceId)
                console.log( es._id.toString())
                if(vote[i].choiceId==es._id.toString()){
                    valor =valor+1
                  if(valor>num){
                      num =valor
                        ress = {
                            title: es.title,
                            votes: num
                        }
                        
                    }
                }
                
            }
           
        })
        console.log(ress)

    
        res.send(201);
    }catch(e){
        console.log(e)
        res.sendStatus(500);
    }

})
conexao.then(()=>{
    db = mongoClient.db("drivencracy");
    console.log('Banco de dados conectado')

})

app.listen(process.env.PORT,() =>{
    console.log(chalk.bold.green('funcionando! na porta'+process.env.PORT))
})