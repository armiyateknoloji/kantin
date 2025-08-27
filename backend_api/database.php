<?php
if($_SERVER['REMOTE_ADDR'] == "::1") 
{
  $servername = "localhost";
  $username = "root";
  $password = "";
  $dbname = "kafe"; 
}
else {
  $servername = "localhost";
  $username = "kantin";
  $password = "wI7mcShHDPvPNjN";
  $dbname = "kantin"; 
}
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Veritabanı bağlantı hatası: " . $e->getMessage());
}
?>
