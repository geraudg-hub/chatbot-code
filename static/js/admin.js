$(document).ready(function() {
    // Initialisation DB AJAX
    $('#threadsTable').DataTable({
        "ajax": {
            "url": "/admin/threads",
            "dataSrc": ""
        },
        "columns": [
            { "data": "thread_id" },
            { "data": "title" },
            {
                "data": "created_at",
                "render": function(data, type, row) {
                  // Converting date
                  let dateObj = new Date(data);
                  let localDate = dateObj.toLocaleString();
                  let sortableDate = dateObj.toISOString();
                  
                  return `<span class="sortableDate" style="display: none;">${sortableDate}</span>${localDate}`;
                }
              }
              ,
            { "data": "message_count" },
            { 
                "data": "last_message",
                "render": function(data, type, row) {
                    // Limiting text lenght to 100 characteres
                    let truncatedMessage = data.length > 100 ? data.substring(0, 100) + "..." : data;
                    return truncatedMessage;
                }
            },
            { 
                "data": "thread_id",
                "render": function(data, type, row) {
                    // Show messages of thread button
                    return `<a href="/admin/thread/${data}/messages/view" class="btn btn-primary">Voir Messages</a>`;
                }
            }
        ],
        // CDF, PLF
        "order": [[ 2, "desc" ]],
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json"
        }
    });
});
