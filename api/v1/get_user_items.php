<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../config/calconn_env.php'; // your mysqli connection

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    // Get inputs
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

    if ($user_id <= 0) {
        throw new Exception("Missing or invalid user_id.");
    }

    // Prepare query
    $sql = "
        SELECT
            i.item_id,
            i.uid,
            i.component_type,
            i.summary,
            i.description,
            i.tzid,
            i.dtstart_utc,
            i.pinned,
            i.item_emoji,
            i.item_color
        FROM items_v1_tb AS i
        INNER JOIN calendars_v1_tb AS c ON i.calendar_id = c.calendar_id
        LEFT JOIN subscriptions_v1_tb AS s ON s.calendar_id = c.calendar_id
        WHERE
            (
                (c.user_id = ? AND c.is_active = 1)
                OR
                (c.classification = 'PUBLIC' AND c.is_active = 1 AND s.user_id = ?)
            )
            AND YEAR(i.dtstart_utc) = ?
        ORDER BY i.dtstart_utc ASC
    ";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("iii", $user_id, $user_id, $year);
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = [
            'item_id'       => (int)$row['item_id'],
            'uid'           => $row['uid'],
            'component_type'=> $row['component_type'],
            'summary'       => $row['summary'],
            'description'   => $row['description'],
            'tzid'          => $row['tzid'],
            'dtstart_utc'   => $row['dtstart_utc'],
            'pinned'        => (int)$row['pinned'],
            'item_emoji'    => $row['item_emoji'],
            'item_color'    => $row['item_color']
        ];
    }

    $response['success'] = true;
    $response['data'] = $items;

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
