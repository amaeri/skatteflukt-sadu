<script>
	import companyCards from "./companycards.js"
	import taxCards from "./taxcards.js"
	import saboCards from "./sabocards.js"

	let companyCard = false
	let taxCard = false
	let saboCard = false

	let openTaxCards
	const getTaxCards = () => {
		openTaxCards = taxCards.results
	}
	getTaxCards()

</script>

<main>
	<div class="container">

		<div class="kort">
			{#if !companyCard}
				<div id="company_closed" class="card_closed" on:click={ () => companyCard = true}>
				</div>
			{:else}
				<div class="card_open" on:click={ () => companyCard = false}>
				</div>
			{/if}
		</div>

		<div class="kort" id="skattekort">
			{#if !taxCard}
				<div id="tax_closed" class="card_closed" on:click={ () => taxCard = true}>
				</div>
			{:else}
				<div class="card_open" on:click={ () => taxCard = false}>
					{#each openTaxCards as openTaxCard}
						<img src="{openTaxCard.tax}" alt="skattekort">
					{/each}
				</div>
			{/if}
		</div>

		<div class="kort" id="sabotasjekort">
			{#if !saboCard}
				<div id="sabo_closed" class="card_closed" on:click={ () => saboCard = true}>
				</div>
			{:else}
				<div class="card_open" on:click={ () => saboCard = false}>
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
	}

	.kort {
		padding: 1rem;
		border-radius: 10px;
		width: 200px;
		height: 300px;
	}

	.card_closed,
	.card_open {
		width: 100%;
		height: 100%;
		background-size: contain;
	}

	.card_open img {
		width: 100%;
		height: 100%;
		background-size: contain;
	}
	

	#tax_closed {
		background-image: url("../img/skatt_front.png");
	}

</style>