
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            navbar.style.transform = 'translateX(-50%)';
            return;
        }
        
        if (currentScroll > lastScroll && currentScroll > 80) {
            navbar.style.transform = 'translate(-50%, -150%)';
        } else {
            navbar.style.transform = 'translateX(-50%)';
        }
        
        lastScroll = currentScroll;
    });


    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        const dropdownMenu = userProfile.querySelector('.dropdown-menu');
        
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
});

const notificationsButton = document.querySelector('.notifications-button');
const notificationsDropdown = document.querySelector('.notifications-dropdown');
const markAllReadButton = document.querySelector('.mark-all-read');
const notificationItems = document.querySelectorAll('.notification-item');

if (notificationsButton) {
    notificationsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!notificationsDropdown.contains(e.target)) {
            notificationsDropdown.classList.remove('active');
        }
    });
}

if (markAllReadButton) {
    markAllReadButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                document.querySelectorAll('.notification-unread').forEach(item => {
                    item.classList.remove('notification-unread');
                });
                const badge = document.querySelector('.notification-badge');
                if (badge) badge.remove();
            }
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
        }
    });
}

notificationItems.forEach(item => {
    item.addEventListener('click', async () => {
        if (item.classList.contains('notification-unread')) {
            const notificationId = item.dataset.id;
            try {
                const response = await fetch(`/api/notifications/${notificationId}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    item.classList.remove('notification-unread');
                    updateNotificationBadge();
                }
            } catch (error) {
                console.error('Erro ao marcar notificação como lida:', error);
            }
        }
    });
});

function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-unread').length;
    const badge = document.querySelector('.notification-badge');
    
    if (unreadCount === 0 && badge) {
        badge.remove();
    } else if (badge) {
        badge.textContent = unreadCount;
    }
} 