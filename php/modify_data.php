<?php
// Connect to the MySQL database
$servername = "sql301.infinityfree.com";  // Replace with your MySQL server hostname
$username = "if0_34388384";  // Replace with your MySQL username
$password = "twDZs7DM5TrVK";  // Replace with your MySQL password
$database = "if0_34388384_main";  // Replace with the name of your database

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Run the SQL query
$sql = $_POST['sql'];
$result = $conn->query($sql);

if ($result === TRUE) {
    echo "success";
  } else {
    echo "Error: " . $sql . ":" . $conn->error;
  }

$conn->close();
?>
