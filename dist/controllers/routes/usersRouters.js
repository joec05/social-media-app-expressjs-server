var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// userRoutes.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import knexConfig from '../../knexfile.js';
import { v4 as uuidv4 } from 'uuid';
import Knex from 'knex';
const IP = '192.168.1.153';
var db = Knex(knexConfig.development);
const usersRoutes = express.Router();
const secretKey = 'e52bc407-7c31-464f-bce4-8057ce1383ae';
// Login route
usersRoutes.post('/login', (req, res) => {
    // Implement login logic here
});
// Signup route
usersRoutes.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, password, fullName, birthdate } = req.body;
    console.log(req.body);
    const existingUser = yield db('user_profiles').where({ email }).first();
    if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
    }
    const userId = uuidv4();
    const hashedPassword = yield bcrypt.hash(password, 10);
    yield db('user_profiles').insert({
        userId,
        username,
        email,
        hashedPassword,
        fullName,
        birthdate,
        created_at: new Date(),
    });
    const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
    res.json({ token });
}));
export default usersRoutes;
