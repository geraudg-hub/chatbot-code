document.addEventListener('DOMContentLoaded', function () {
    let messagesPerHourChartInstance = null;
    let threadsChart = null;
    let messagesChart = null;

    // last 24 houres fetch
    fetch('/admin/messages/last_24h')
    .then(response => response.json())
    .then(data => {
        // Display last 24H data
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


    // Graph thread and messages / day
    fetch('/admin/messages/threads_per_day')
        .then(response => response.json())
        .then(data => {
            const threadsData = data.threads_data;
            const messagesData = data.messages_data;

            const dates = threadsData.map(item => item.date);
            const threadCounts = threadsData.map(item => item.thread_count);
            const messageCounts = messagesData.map(item => item.message_count);

            // Thread / day
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

            // Messages / day
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

    // Average messages / houre
    const daysSelect = document.getElementById('days-select');
    daysSelect.addEventListener('change', function () {
        const days = daysSelect.value;

        if (messagesPerHourChartInstance) {
            messagesPerHourChartInstance.destroy();
        }

        fetch(`/admin/messages/messages_per_hour?days=${days}`)
            .then(response => response.json())
            .then(data => {
                const hours = Array.from({ length: 24 }, (_, i) => i);
                const messageCounts = new Array(24).fill(0);

                data.forEach(item => {
                    messageCounts[item.hour] = item.message_count;
                });

                // Calculate average message / houre
                const averageMessageCounts = messageCounts.map(count => {
                    return count / days;
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

    // Default charging 7 last days
    fetch(`/admin/messages/messages_per_hour?days=7`)
        .then(response => response.json())
        .then(data => {
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const messageCounts = new Array(24).fill(0);

            data.forEach(item => {
                messageCounts[item.hour] = item.message_count;
            });

            const averageMessageCounts = messageCounts.map(count => {
                return count / 7;
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


        document.getElementById('days-select-threads').addEventListener('change', function () {
            const days = this.value;
            fetch(`/admin/messages/threads_per_day?days=${days}`)
                .then(response => response.json())
                .then(data => {
                    const dates = data.threads_data.map(item => item.date);
                    const threadCounts = data.threads_data.map(item => item.thread_count);
                    
                    console.log("Threads par jour:", dates, threadCounts);

                    if (typeof threadsChart !== 'undefined') {
                        threadsChart.data.labels = dates;
                        threadsChart.data.datasets[0].data = threadCounts;
                        threadsChart.update();
                    }
                })
                .catch(error => console.error('Erreur chargement threads:', error));
        });
        
        document.getElementById('days-select-messages').addEventListener('change', function () {
            const days = this.value;
            fetch(`/admin/messages/messages_per_hour?days=${days}`)
                .then(response => response.json())
                .then(data => {
                    const messageCounts = new Array(24).fill(0);
                    data.forEach(item => {
                        messageCounts[item.hour] = item.message_count;
                    });
                    
                    const avgMessageCounts = messageCounts.map(count => count / days);
                    console.log("Moyenne messages par heure:", avgMessageCounts);
        
                    if (messagesPerHourChartInstance) {
                        messagesPerHourChartInstance.data.datasets[0].data = avgMessageCounts;
                        messagesPerHourChartInstance.update();
                    }
                })
                .catch(error => console.error('Erreur chargement messages:', error));
        });
        
});
