const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const DiscordStrategy = require('passport-discord').Strategy;
const fs = require('fs');
const moment = require('moment');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const seu_tokenmaluco = 'teste';
moment.locale('pt-br');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'seu_secret_aqui',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const DISCORD_CLIENT_ID = '1334201431833448518';
const DISCORD_CLIENT_SECRET = '19AhNM_2zKsmvFeEiXh4KlFYENfE__rR';
const CALLBACK_URL = 'https://websitetesite-i6te-git-main-marcelo-souzas-projects-6f16c9a6.vercel.app/auth/discord/callback';

passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'email', 'guilds.join']
}, function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const SUPER_ADMIN_IDS = ['1113945518071107705'];

function donoditudo(userId) {
    return SUPER_ADMIN_IDS.includes(userId);
}

function ademiro(userId) {
    try {
        const admins = JSON.parse(fs.readFileSync('./data/admins.json', 'utf8'));
        return admins.includes(userId) || donoditudo(userId);
    } catch (error) {
        return false;
    }
}

function checkAdmin(req, res, next) {
    if (ademiro(req.user?.id)) {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

function checkSuperAdmin(req, res, next) {
    if (donoditudo(req.user?.id)) {
        next();
    } else {
        res.redirect('/dashboard');
    }
}

app.get('/', (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    res.render('index', {
        titulo: 'TaxadoS - Início',
        user: req.user,
        notifications,
        moment,
        ademiro: req.user ? ademiro(req.user.id) : false
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        titulo: 'TaxadoS - Login'
    });
});

app.get('/auth/discord', passport.authenticate('discord'));

const DISCORD_SERVER_ID = '1249346251674091591';
const DISCORD_INVITE_CHANNEL = '1272371373871730720';

app.get('/auth/discord/callback', 
    passport.authenticate('discord', {
        failureRedirect: '/login'
    }), 
    async (req, res) => {
        try {
            const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${req.user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bot ${seu_tokenmaluco}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: req.user.accessToken
                })
            });

            if (!response.ok && response.status !== 204) {
                const invite = await fetch(`https://discord.com/api/v10/channels/${DISCORD_INVITE_CHANNEL}/invites`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${seu_tokenmaluco}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        max_age: 86400,
                        max_uses: 1,
                        unique: true
                    })
                }).then(res => res.json());

                if (invite.code) {
                    res.redirect(`https://discord.gg/${invite.code}`);
                    return;
                }
            }
            
            res.redirect('/dashboard');
        } catch (error) {
            res.redirect('/dashboard');
        }
    }
);

app.get('/dashboard', isAuthenticated, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    res.render('dashboard', {
        titulo: 'TaxadoS - Dashboard',
        user: req.user,
        ademiro: ademiro(req.user.id),
        donoditudo: donoditudo(req.user.id),
        path: '/dashboard',
        notifications,
        moment
    });
});

app.get('/dashboard/denunciar', isAuthenticated, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
    
    res.render('dashboard/denunciar', {
        titulo: 'TaxadoS - Denunciar',
        user: req.user,
        ademiro: ademiro(req.user.id),
        donoditudo: donoditudo(req.user.id),
        path: '/dashboard/denunciar',
        notifications,
        denuncias,
        moment
    });
});

app.get('/dashboard/minhas-denuncias', isAuthenticated, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'))
        .filter(d => d.authorId === req.user.id);
    
    res.render('dashboard/minhas-denuncias', {
        titulo: 'TaxadoS - Minhas Denúncias',
        user: req.user,
        ademiro: ademiro(req.user.id),
        donoditudo: donoditudo(req.user.id),
        path: '/dashboard/minhas-denuncias',
        notifications,
        moment,
        denuncias
    });
});

app.get('/dashboard/admin/staffs', checkSuperAdmin, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    const admins = JSON.parse(fs.readFileSync('./data/admins.json', 'utf8'));
    res.render('dashboard/admin/staffs', {
        titulo: 'TaxadoS - Gerenciar Staffs',
        user: req.user,
        admins: admins,
        ademiro: ademiro(req.user.id),
        donoditudo: donoditudo(req.user.id),
        path: '/dashboard/admin/staffs',
        notifications,
        moment
    });
});

app.post('/dashboard/admin/staffs/add', checkSuperAdmin, (req, res) => {
    const { userId } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        const admins = JSON.parse(fs.readFileSync('./data/admins.json', 'utf8'));
        if (!admins.includes(userId)) {
            admins.push(userId);
            fs.writeFileSync('./data/admins.json', JSON.stringify(admins));
        }
        res.redirect('/dashboard/admin/staffs');
    } catch (error) {
        res.status(500).send('Erro ao adicionar staff');
    }
});

app.post('/dashboard/admin/staffs/remove', checkSuperAdmin, (req, res) => {
    const { userId } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        let admins = JSON.parse(fs.readFileSync('./data/admins.json', 'utf8'));
        admins = admins.filter(id => id !== userId);
        fs.writeFileSync('./data/admins.json', JSON.stringify(admins));
        res.redirect('/dashboard/admin/staffs');
    } catch (error) {
        res.status(500).send('Erro ao remover staff');
    }
});

app.get('/dashboard/admin/parceiros', checkAdmin, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    try {
        const parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        res.render('dashboard/admin/parceiros', {
            titulo: 'TaxadoS - Gerenciar Parceiros',
            user: req.user,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/parceiros',
            parceiros: parceiros,
            notifications,
            moment
        });
    } catch (error) {
        res.render('dashboard/admin/parceiros', {
            titulo: 'TaxadoS - Gerenciar Parceiros',
            user: req.user,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/parceiros',
            parceiros: [],
            notifications,
            moment
        });
    }
});

app.post('/dashboard/admin/parceiros/add', checkAdmin, (req, res) => {
    const { name, discordId, serverInvite, serverImage } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        const parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        parceiros.push({ 
            name, 
            discordId, 
            serverInvite, 
            serverImage,
            addedAt: new Date().toISOString() 
        });
        fs.writeFileSync('./data/parceiros.json', JSON.stringify(parceiros, null, 2));
        res.redirect('/dashboard/admin/parceiros');
    } catch (error) {
        res.status(500).send('Erro ao adicionar parceiro');
    }
});

app.post('/dashboard/admin/parceiros/remove', checkAdmin, (req, res) => {
    const { discordId } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        let parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        parceiros = parceiros.filter(p => p.discordId !== discordId);
        fs.writeFileSync('./data/parceiros.json', JSON.stringify(parceiros, null, 2));
        res.redirect('/dashboard/admin/parceiros');
    } catch (error) {
        res.status(500).send('Erro ao remover parceiro');
    }
});

app.get('/dashboard/admin/parceiros/edit/:discordId', checkAdmin, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    try {
        const parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        const parceiro = parceiros.find(p => p.discordId === req.params.discordId);
        if (!parceiro) {
            return res.redirect('/dashboard/admin/parceiros');
        }
        res.render('dashboard/admin/parceiros-edit', {
            titulo: 'TaxadoS - Editar Parceiro',
            user: req.user,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/parceiros',
            parceiro: parceiro,
            notifications,
            moment
        });
    } catch (error) {
        res.redirect('/dashboard/admin/parceiros');
    }
});

app.post('/dashboard/admin/parceiros/edit/:discordId', checkAdmin, (req, res) => {
    const { name, serverInvite, serverImage } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        let parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        const index = parceiros.findIndex(p => p.discordId === req.params.discordId);
        if (index !== -1) {
            parceiros[index] = {
                ...parceiros[index],
                name,
                serverInvite,
                serverImage,
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync('./data/parceiros.json', JSON.stringify(parceiros, null, 2));
        }
        res.redirect('/dashboard/admin/parceiros');
    } catch (error) {
        res.status(500).send('Erro ao editar parceiro');
    }
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.get('/parceiros', (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    try {
        const parceiros = JSON.parse(fs.readFileSync('./data/parceiros.json', 'utf8'));
        res.render('parceiros', {
            titulo: 'TaxadoS - Parceiros',
            user: req.user,
            parceiros: parceiros,
            notifications,
            moment,
            ademiro: req.user ? ademiro(req.user.id) : false
        });
    } catch (error) {
        res.render('parceiros', {
            titulo: 'TaxadoS - Parceiros',
            user: req.user,
            parceiros: [],
            notifications,
            moment,
            ademiro: req.user ? ademiro(req.user.id) : false
        });
    }
});

app.get('/dashboard/admin/denuncias', checkAdmin, (req, res) => {
    const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
    try {
        const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        res.render('dashboard/admin/denuncias', {
            titulo: 'TaxadoS - Gerenciar Denúncias',
            user: req.user,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/denuncias',
            denuncias: denuncias,
            moment: moment,
            notifications
        });
    } catch (error) {
        res.render('dashboard/admin/denuncias', {
            titulo: 'TaxadoS - Gerenciar Denúncias',
            user: req.user,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/denuncias',
            denuncias: [],
            moment: moment,
            notifications
        });
    }
});

app.post('/dashboard/denunciar', isAuthenticated, (req, res) => {
    const { scammerName, scammerID, proofType, proofLink, description } = req.body;
    try {
        const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        
        const scammerExistente = denuncias.find(d => 
            d.scammerID === scammerID && 
            d.status === 'approved'
        );

        if (scammerExistente) {
            return res.send(`
                <div class="notification-toast error" id="notification">
                    <img src="/images/alert-icon.svg" alt="Erro">
                    <span>Este usuário já está na lista de scammers!</span>
                </div>
                <script>
                    const notification = document.getElementById('notification');
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        setTimeout(() => {
                            window.location.href = '/dashboard/denunciar';
                        }, 300);
                    }, 3000);
                </script>
            `);
        }

        const denuncia = {
            id: Date.now().toString(),
            scammerName,
            scammerID,
            proofType,
            proofLink,
            description,
            status: 'pending',
            authorId: req.user.id,
            authorName: req.user.username,
            createdAt: new Date().toISOString(),
            notifications: []
        };
        denuncias.push(denuncia);
        fs.writeFileSync('./data/denuncias.json', JSON.stringify(denuncias, null, 2));
        
        addNotification('Nova denúncia recebida', `${req.user.username} denunciou ${scammerName}`, 'staff');
        
        res.redirect('/dashboard/minhas-denuncias');
    } catch (error) {
        res.status(500).send('Erro ao criar denúncia');
    }
});

app.post('/dashboard/admin/denuncias/:id/status', checkAdmin, (req, res) => {
    const { status, reason } = req.body;
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        let denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        const index = denuncias.findIndex(d => d.id === req.params.id);
        
        if (index !== -1) {
            denuncias[index].status = status;
            denuncias[index].reason = reason;
            denuncias[index].reviewedBy = req.user.username;
            denuncias[index].reviewedAt = new Date().toISOString();
            
            fs.writeFileSync('./data/denuncias.json', JSON.stringify(denuncias, null, 2));
            
            addNotification(
                'Denúncia atualizada',
                `Sua denúncia contra ${denuncias[index].scammerName} foi ${status === 'approved' ? 'aprovada' : 'reprovada'}`,
                'user',
                denuncias[index].authorId
            );
        }
        
        res.redirect('/dashboard/admin/denuncias');
    } catch (error) {
        res.status(500).send('Erro ao atualizar denúncia');
    }
});

function addNotification(title, message, type, userId = null) {
    try {
        const notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        notifications.push({
            id: Date.now().toString(),
            title,
            message,
            type,
            userId,
            createdAt: new Date().toISOString(),
            read: false
        });
        fs.writeFileSync('./data/notifications.json', JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Erro ao adicionar notificação:', error);
    }
}

app.post('/api/notifications/mark-all-read', isAuthenticated, (req, res) => {
    try {
        let notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        notifications = notifications.map(n => {
            if (n.type === 'all' || 
                (n.type === 'user' && n.userId === req.user.id) || 
                (n.type === 'staff' && ademiro(req.user.id))) {
                return { ...n, read: true };
            }
            return n;
        });
        fs.writeFileSync('./data/notifications.json', JSON.stringify(notifications, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
});

app.post('/api/notifications/:id/read', isAuthenticated, (req, res) => {
    try {
        let notifications = JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8'));
        const index = notifications.findIndex(n => n.id === req.params.id);
        if (index !== -1) {
            notifications[index].read = true;
            fs.writeFileSync('./data/notifications.json', JSON.stringify(notifications, null, 2));
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
});


app.get('/scammers', async (req, res) => {
    try {
        const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'))
            .filter(d => d.status === 'approved');

        const denunciasComAvatar = await Promise.all(denuncias.map(async (denuncia) => {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${denuncia.scammerID}/${await getDiscordAvatar(denuncia.scammerID)}`;
            return {
                ...denuncia,
                avatarUrl: avatarUrl || '/images/default-avatar.png'
            };
        }));
        
        res.render('scammers', {
            titulo: 'TaxadoS - Lista de Scammers',
            user: req.user,
            denuncias: denunciasComAvatar,
            notifications: JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8')),
            moment,
            ademiro: req.user ? ademiro(req.user.id) : false
        });
    } catch (error) {
        res.render('scammers', {
            titulo: 'TaxadoS - Lista de Scammers',
            user: req.user,
            denuncias: [],
            notifications: [],
            moment,
            ademiro: req.user ? ademiro(req.user.id) : false
        });
    }
});

async function getDiscordAvatar(userId) {
    try {
        const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: {
                Authorization: `Bot ${seu_tokenmaluco}`
            }
        });
        const data = await response.json();
        return data.avatar;
    } catch (error) {
        return null;
    }
}

app.get('/dashboard/admin/scammers', checkAdmin, async (req, res) => {
    try {
        const denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'))
            .filter(d => d.status === 'approved');

        const denunciasComAvatar = await Promise.all(denuncias.map(async (denuncia) => {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${denuncia.scammerID}/${await getDiscordAvatar(denuncia.scammerID)}`;
            return {
                ...denuncia,
                avatarUrl: avatarUrl || '/images/default-avatar.png'
            };
        }));
        
        res.render('dashboard/admin/scammers', {
            titulo: 'TaxadoS - Gerenciar Scammers',
            user: req.user,
            denuncias: denunciasComAvatar,
            notifications: JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8')),
            moment,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/scammers'
        });
    } catch (error) {
        res.render('dashboard/admin/scammers', {
            titulo: 'TaxadoS - Gerenciar Scammers',
            user: req.user,
            denuncias: [],
            notifications: [],
            moment,
            ademiro: ademiro(req.user.id),
            donoditudo: donoditudo(req.user.id),
            path: '/dashboard/admin/scammers'
        });
    }
});

app.post('/dashboard/admin/scammers/:id/revoke', checkAdmin, (req, res) => {
    const { reason } = req.body;
    try {
        let denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        const index = denuncias.findIndex(d => d.id === req.params.id);
        
        if (index !== -1) {
            denuncias[index].status = 'revoked';
            denuncias[index].revokedBy = req.user.username;
            denuncias[index].revokeReason = reason;
            denuncias[index].revokedAt = new Date().toISOString();
            
            fs.writeFileSync('./data/denuncias.json', JSON.stringify(denuncias, null, 2));
            
            addNotification(
                'Denúncia revogada',
                `Sua denúncia contra ${denuncias[index].scammerName} foi revogada`,
                'user',
                denuncias[index].authorId
            );
        }
        
        res.redirect('/dashboard/admin/scammers');
    } catch (error) {
        res.status(500).send('Erro ao revogar scammer');
    }
});

app.get('/termos', (req, res) => {
    res.render('termos', {
        titulo: 'TaxadoS - Termos de Uso',
        user: req.user,
        notifications: JSON.parse(fs.readFileSync('./data/notifications.json', 'utf8')),
        moment,
        ademiro: req.user ? ademiro(req.user.id) : false
    });
});

app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
   
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            avatar: null,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
        
        req.login(newUser, (err) => {
            if (err) throw err;
            res.json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Email ou senha incorretos' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Email ou senha incorretos' });
        }

        req.login(user, (err) => {
            if (err) throw err;
            res.json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    res.setHeader('Content-Security-Policy', "default-src 'self' https: 'unsafe-inline' 'unsafe-eval'");
    

    res.removeHeader('X-Powered-By');
    
    next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


app.post('/dashboard/admin/denuncias/bulk-approve', checkAdmin, async (req, res) => {
    const { ids } = req.body;
    
    try {
        let denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        
        ids.forEach(id => {
            const index = denuncias.findIndex(d => d.id === id);
            if (index !== -1 && denuncias[index].status === 'pending') {
                denuncias[index].status = 'approved';
                denuncias[index].reviewedBy = req.user.username;
                denuncias[index].reviewedAt = new Date().toISOString();
                
                addNotification(
                    'Denúncia atualizada',
                    `Sua denúncia contra ${denuncias[index].scammerName} foi aprovada`,
                    'user',
                    denuncias[index].authorId
                );
            }
        });
        
        fs.writeFileSync('./data/denuncias.json', JSON.stringify(denuncias, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao aprovar denúncias' });
    }
});

app.post('/dashboard/admin/denuncias/bulk-reject', checkAdmin, async (req, res) => {
    const { ids, reason } = req.body;
    
    try {
        let denuncias = JSON.parse(fs.readFileSync('./data/denuncias.json', 'utf8'));
        
        ids.forEach(id => {
            const index = denuncias.findIndex(d => d.id === id);
            if (index !== -1 && denuncias[index].status === 'pending') {
                denuncias[index].status = 'rejected';
                denuncias[index].reason = reason;
                denuncias[index].reviewedBy = req.user.username;
                denuncias[index].reviewedAt = new Date().toISOString();
                
                addNotification(
                    'Denúncia atualizada',
                    `Sua denúncia contra ${denuncias[index].scammerName} foi reprovada`,
                    'user',
                    denuncias[index].authorId
                );
            }
        });
        
        fs.writeFileSync('./data/denuncias.json', JSON.stringify(denuncias, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao reprovar denúncias' });
    }
}); 
