<?php include 'header.php'; ?>  <!-- charge le header avec menu -->

<section id="contact" class="contact">
    <h2>Nous Contacter</h2>
    <p>
        📍 123 Rue du Goût, Paris<br>
        📞 01 23 45 67 89<br>
        ✉️ contact@samoussadelices.fr
    </p>

    <!-- Formulaire -->
    <form action="send_message.php" method="post" class="contact-form">
        <label for="name">Nom :</label>
        <input type="text" id="name" name="name" required>

        <label for="email">Email :</label>
        <input type="email" id="email" name="email" required>

        <label for="message">Message :</label>
        <textarea id="message" name="message" rows="5" required></textarea>

        <button type="submit">Envoyer</button>
    </form>
</section>

<?php include 'footer.php'; ?>  <!-- charge le footer -->