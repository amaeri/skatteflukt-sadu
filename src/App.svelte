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

	const pickCompCard = () => {
		let randomCompCard = Math.round(Math.random() * (compList.length - 1))
		cardComp = compList[randomCompCard]
	}

	const pickTaxCard = () => {
		let randomTaxCard = Math.round(Math.random() * (taxList.length - 1))
		cardTax = taxList[randomTaxCard]
	}

	const pickSaboCard = () => {
		let randomSaboCard = Math.round(Math.random() * (saboList.length - 1))
		cardSabo = saboList[randomSaboCard]
	}

	const pushCompCards = () => {
		if(companyCard = true)
			pickCompCard()
	}

	const pushTaxCards = () => {
		if(taxCard = true)
			pickTaxCard()
	}

	const pushSaboCards = () => {
		if(saboCard = true)
			pickSaboCard()
	}

</script>

<main>
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
	}

	main {
		display: grid;
		place-items: center;
		text-align: center;
		margin: 0 auto;
	}

	.container {
		display: grid;
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
		background-size: contain;
		backface-visibility: hidden;
	}

	.card .face img {
		width: 100%;
		height: 100%;
	}

	.card .face.front {
		z-index: 1;
	}

	/* .card .face.back {
		transform: rotateY(180deg);
		z-index: 0;
	}

	.card.flipped {
		transform: rotateY(180deg);
	} */

	.company .front {
		background-image: url("../img/bed_front.png");
	}

	.tax .front {
		background-image: url("../img/skatt_front.png");
	}

	.sabo .front {
		background-image: url("../img/sabo_front.png");
	}

</style>