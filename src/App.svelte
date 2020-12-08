<script>
	import compList from "./companycards.js"
	import taxList from "./taxcards.js"
	import saboList from "./sabocards.js"

	import { fly } from "svelte/transition"

	let companyCard
	let taxCard
	let saboCard

	let cardComp
	let cardTax
	let cardSabo


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
		if (companyCard = true) {
			pickCompCard()
		}
	}

	const pushTaxCards = () => {
		if (taxCard = true) {
			pickTaxCard()
		}
	}

	const pushSaboCards = () => {
		if (saboCard = true) {
			pickSaboCard()
		}
	}

	////// FLIP TRANSITION //////
	let flipped = false
		
		function turn(node, {
			delay = 0,
			duration = 500
		}) {
			return {
				delay,
				duration,
				css: (t, u) => `
					transform: rotateY(${1 - (u * 180)}deg);
					backface-visibility: hidden;
				`
			};
	}
	
	export function flip () {
		flipped = !flipped
	}
	////////////

</script>

<main>
	<div id="logo">
		<img src="./img/logo.png" alt="logo">
		<p>Trykk på kortene for å åpne, trykk en gang til for å lukke</p>
	</div>

	<div class="container">

		<div class:flipped class="card company">
			{#if !companyCard}
				<div class="face front" on:click={ () => pushCompCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => companyCard = false} transition:turn>
					<img src="{cardComp.image}" alt="Bedriftskort">
				</div>
			{/if}
		</div>

		<div class:flipped class="card tax">
			{#if !taxCard}
				<div class="face front" on:click={ () => pushTaxCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => taxCard = false} transition:turn>
					<img src="{cardTax.image}" alt="Skattekort">
				</div>
			{/if}
		</div>

		<div class:flipped class="card sabo">
			{#if !saboCard}
				<div class="face front" on:click={ () => pushSaboCards()} transition:turn>
				</div>
			{:else}
				<div class="face back" on:click={ () => saboCard = false} transition:turn>
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
		top: 2rem;
		width: 100%;
		text-align: center;
	}

	#logo img{
		width: 450px;
	}

	#logo p {
		padding-top: 1rem;
	}

	.container {
		display: grid;
		position: relative;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		width: 900px;
		height: 700px;
	}

	.card {
		width: 200px;
		height: 300px;
		cursor: pointer;
		position: relative;
		user-select: none;
		perspective: 600px;
	}

	.card .face {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.card .front {
		background-size: contain;
		z-index: 1;
	}

	.card.company .front{
		background-image: url("../img/bed_front.png");
	}

	.card.tax .front{
		background-image: url("../img/skatt_front.png");
	}

	.card.sabo .front{
		background-image: url("../img/sabo_front.png");
	}

	.card .back img {
		width: 100%;
		height: 100%;
	}


</style>