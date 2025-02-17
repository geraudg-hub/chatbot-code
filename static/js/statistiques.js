document.addEventListener('DOMContentLoaded', function () {
    let messagesPerHourChartInstance = null;

    // Fonction pour récupérer les stats des 24 dernières heures
    fetch('/admin/messages/last_24h')
    .then(response => response.json())
    .then(data => {
        // Récupérer et afficher les statistiques des dernières 24h
        document.getElementById('threads-24h').textContent = data.threads_count;
        document.getElementById('messages-24h').textContent = data.messages_count;
    })
    .catch(error => console.error('Error fetching last 24h stats:', error));

    fetch('/admin/messages/total')
    .then(response => response.json())
    .then(totalData => {
        document.getElementById('total-threads').textContent = totalData.total_threads;
        document.getElementById('total-messages').textContent = totalData.total_messages;
    })
    .catch(error => console.error('Error fetching total stats:', error));


    // Graphique des threads et messages par jour
    fetch('/admin/messages/threads_per_day')
        .then(response => response.json())
        .then(data => {
            const threadsData = data.threads_data;
            const messagesData = data.messages_data;

            const dates = threadsData.map(item => item.date);
            const threadCounts = threadsData.map(item => item.thread_count);
            const messageCounts = messagesData.map(item => item.message_count);

            // Graphique des threads par jour
            const ctxThreads = document.getElementById('threadsPerDayChart').getContext('2d');
            new Chart(ctxThreads, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Threads créés',
                        data: threadCounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: 'Date' }
                        },
                        y: {
                            title: { display: true, text: 'Nombre de threads' }
                        }
                    }
                }
            });

            // Graphique des messages par jour
            const ctxMessages = document.getElementById('messagesPerDayChart').getContext('2d');
            new Chart(ctxMessages, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Messages créés',
                        data: messageCounts,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: 'Date' }
                        },
                        y: {
                            title: { display: true, text: 'Nombre de messages' }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching threads and messages per day stats:', error));

    // Graphique des messages moyens par heure
    const daysSelect = document.getElementById('days-select');
    daysSelect.addEventListener('change', function () {
        const days = daysSelect.value;

        // Détruire le graphique précédent si il existe déjà
        if (messagesPerHourChartInstance) {
            messagesPerHourChartInstance.destroy();
        }

        // Récupérer les données avec la valeur correcte de 'days'
        fetch(`/admin/messages/messages_per_hour?days=${days}`)
            .then(response => response.json())
            .then(data => {
                const hours = Array.from({ length: 24 }, (_, i) => i); // Créer un tableau de 0 à 23 pour les heures
                const messageCounts = new Array(24).fill(0); // Initialiser le tableau avec des 0

                data.forEach(item => {
                    messageCounts[item.hour] = item.message_count;
                });

                // Calculer la moyenne des messages par heure
                const averageMessageCounts = messageCounts.map(count => {
                    return count / days; // Diviser par le nombre de jours pour obtenir la moyenne
                });

                const ctx = document.getElementById('messagesPerHourChart').getContext('2d');
                messagesPerHourChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: hours,
                        datasets: [{
                            label: 'Messages Moyens par Heure',
                            data: averageMessageCounts,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgb(75, 192, 192)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: {
                                title: { display: true, text: 'Heure' }
                            },
                            y: {
                                title: { display: true, text: 'Nombre moyen de messages' }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error fetching messages per hour stats:', error));
    });

    // Charger par défaut les données des 7 derniers jours
    fetch(`/admin/messages/messages_per_hour?days=7`)
        .then(response => response.json())
        .then(data => {
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const messageCounts = new Array(24).fill(0);

            data.forEach(item => {
                messageCounts[item.hour] = item.message_count;
            });

            // Calculer la moyenne des messages par heure
            const averageMessageCounts = messageCounts.map(count => {
                return count / 7; // Diviser par 7 pour obtenir la moyenne sur 7 jours
            });

            const ctx = document.getElementById('messagesPerHourChart').getContext('2d');
            messagesPerHourChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Messages Moyens par Heure',
                        data: averageMessageCounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: 'Heure' }
                        },
                        y: {
                            title: { display: true, text: 'Nombre moyen de messages' }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error fetching messages per hour stats:', error));
});
