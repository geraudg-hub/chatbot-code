$(document).ready(function() {
    // Initialisation de DataTables avec AJAX
    $('#threadsTable').DataTable({
        "ajax": {
            "url": "http://localhost/admin/threads", // Assurez-vous que le serveur Flask tourne sur le port 5000
            "dataSrc": ""
        },
        "columns": [
            { "data": "thread_id" },
            { "data": "title" },
            {
                "data": "created_at",
                "render": function(data, type, row) {
                  // Convertir la date ISO en format local
                  let dateObj = new Date(data);
                  let localDate = dateObj.toLocaleString(); // Pour l'affichage
                  let sortableDate = dateObj.toISOString(); // Pour le tri (en ISO format)
                  
                  // Retourner la date formatée pour l'affichage, et garder la date ISO pour le tri
                  return `<span class="sortableDate" style="display: none;">${sortableDate}</span>${localDate}`;
                }
              }
              ,
            { "data": "message_count" },
            { 
                "data": "last_message",
                "render": function(data, type, row) {
                    // Limiter la longueur du texte de la colonne "Dernier message" à 100 caractères
                    let truncatedMessage = data.length > 100 ? data.substring(0, 100) + "..." : data;
                    return truncatedMessage;
                }
            },
            { 
                "data": "thread_id",
                "render": function(data, type, row) {
                    // Créer un bouton qui redirige vers une page avec les messages du thread
                    return `<a href="http://localhost/admin/thread/${data}/messages/view" class="btn btn-primary">Voir Messages</a>`;
                }
            }
        ],
        // Optionnel : activer le tri multi-colonnes, pagination, etc.
        "order": [[ 2, "desc" ]],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json"
        }
    });
});
