const Sequelize = require('sequelize');
const { Op } = Sequelize;
const Users = require('../models/t_usersModel')
const Roles = require('../models/t_rolesModel')
const RolesCodes = require('../models/t_rolesCodesModel')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const refreshToken = async (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) {
        return res.sendStatus(401)
    }
    const refreshToken = cookies.jwt
    //console.log(cookies.jwt)
    const foundUser = await Users.findOne({
        where: { "token_use": refreshToken },
        include: [{
            model: Roles,
            include: [{
                model: RolesCodes
            }]
        }]
    })
    if (!foundUser) {
        return res.sendStatus(403)
    }
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.username !== decoded.username ) {
                return res.sendStatus(403)
            }
            const roles = foundUser.t_roles.map(role => role.t_rolescode.name_rol) 
            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": decoded.username,
                        "roles": roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '30s' }
            )
            res.json({ accessToken })
        }
    )
}

module.exports = { refreshToken }