<script>
	import compList from "./companycards.js"
	import taxList from "./taxcards.js"
	import saboList from "./sabocards.js"

	let companyCard = false
	let taxCard = false
	let saboCard = false

	let cardComp = 0
	let cardTax = 0
	let cardSabo = 0

	let flipped = 0

	//bør man ha -1 bak .length?

	const pickCompCard = () => {
		let randomCompCard = Math.round(Math.random() * (compList.length))
		cardComp = compList[randomCompCard]
	}

	const pickTaxCard = () => {
		let randomTaxCard = Math.round(Math.random() * (taxList.length))
		cardTax = taxList[randomTaxCard]
	}

	const pickSaboCard = () => {
		let randomSaboCard = Math.round(Math.random() * (saboList.length))
		cardSabo = saboList[randomSaboCard]
	}

	const pushCompCards = () => {
		if (companyCard = true)
			pickCompCard()
	}

	const pushTaxCards = () => {
		if (taxCard = true)
			pickTaxCard()
	}

	const pushSaboCards = () => {
		if (saboCard = true)
			pickSaboCard()
	}
</script>

<main>
	<div id="logo">
		<img src="./img/logo.png" alt="logo">
		<p>Trykk på kortene for å åpne, trykk en gang til for å lukke</p>
	</div>

	<div class="container">

		<div class="card company flipped">
			{#if !companyCard}
				<div class="face front" on:click={ () => pushCompCards()}>
				</div>
			{:else}
				<div class="face back" on:click={ () => companyCard = false}>
					<img src="{cardComp.image}" alt="Bedriftskort">
				</div>
			{/if}
		</div>

		<div class="card tax flipped">
			{#if !taxCard}
				<div class="face front" on:click={ () => pushTaxCards()}>
				</div>
			{:else}
				<div class="face back" on:click={ () => taxCard = false}>
					<img src="{cardTax.image}" alt="Skattekort">
				</div>
			{/if}
		</div>

		<div class="card sabo flipped">
			{#if !saboCard}
				<div class="face front" on:click={ () => pushSaboCards()}>
				</div>
			{:else}
				<div class="face back" on:click={ () => saboCard = false}>
					<img src="{cardSabo.image}" alt="Sabotasjekort">
				</div>
			{/if}
		</div>

	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		background-color: #222222;
		color: white;
	}

	main {
		display: grid;
		place-items: center;
		text-align: center;
		margin: 0 auto;
	}

	#logo {
		position: absolute;
		top: 3rem;
		width: 100%;
		text-align: center;
	}

	#logo img{
		width: 450px;
	}

	.container {
		display: grid;
		position: relative;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		width: 900px;
		height: 700px;
		perspective: 600px;
	}

	.card {
		width: 200px;
		height: 300px;
		cursor: pointer;
		position: relative;
		transition: transform 1s;
		transform-style: preserve-3d;
	}

	.card .face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
	}

	.card .front {
		z-index: 1;
		background-size: contain;
	}

	.card.company .front {
		background-image: url("../img/bed_front.png");
	}

	.card.tax .front {
		background-image: url("../img/skatt_front.png");
	}

	.card.sabo .front {
		background-image: url("../img/sabo_front.png");
	}

	.card .back {
		z-index: 0;
	}

	.card .back img {
		width: 100%;
		height: 100%;
	}

	/* .card.flipped .back {
		z-index: 2;
		transform: rotateY( 180deg );
	}

	.card.flipped {
		transform: rotateY(180deg);
	} */


</style>