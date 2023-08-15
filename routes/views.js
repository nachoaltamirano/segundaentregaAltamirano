import { Router } from 'express';
import fs from 'fs';
import ProductManager from '../ProductManager.js';
import CManager from '../models/DAO/cartM.js';
import PManager from '../models/DAO/prodM.js';
import { Productsmodel } from '../models/prod.model.js';
import { socketServer } from '../app.js';
const viewsRouter = Router()
const manager = new ProductManager()
const cart = new CManager();
const prod = new PManager();


viewsRouter.get('/', (req, res) => {
    const data = fs.readFileSync('carritos.json');
    const cart = JSON.parse(data)
    res.render('home', {cart})
})
viewsRouter.get("/products", async (req, res) => {
    const { page = 1, limit = 4 } = req.query;
    const { docs, hasPrevPage, hasNextPage, nextPage, prevPage } = await Productsmodel.paginate({}, { page, limit, lean: true });
    const productos = docs;
    res.render('home',
        {
            style: 'index.css',
            productos,
            hasPrevPage,
            hasNextPage,
            nextPage,
            prevPage
        });
})


viewsRouter.get("/realtimeproducts", async (req, res) => {
    const productos = await Productsmodel.find().lean();
    res.render('realTimeProducts',
        {
            style: 'index.css',
            productos
        });

})

viewsRouter.post('/realtimeproducts', async (req, res) => {
    let P = req.body;
    if (!P.title || !P.description || !P.code || !P.price || !P.stock || !P.category) {
        return  res.status(400).send({status: "error", error})
    }
    let producto = await prod.addP(P)
    res.send({status: "success", payload: producto})
    const productos = await prod.getP()
    socketServer.emit("newproduct", productos)
})

viewsRouter.delete('/realtimeproducts/:pid', async (req, res) => {
    let pid = req.params.pid
    const producto = await prod.deleteP(pid)
    producto ? res.send({status: "success", payload: producto}) : res.status(400).send({error:"no existe un producto con ese id"})
    let productos = await prod.getP()
    socketServer.emit("productdelete", productos)
})



export default viewsRouter;