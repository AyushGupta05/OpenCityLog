import unittest


class RetiredEnergyProposalLensTests(unittest.TestCase):
    @unittest.skip("Retired Proposal Lens is quarantined by the active 15-lens city atlas contract.")
    def test_retired_energy_proposal_lens_placeholder(self) -> None:
        self.fail("Energy proposal tests must not run while the Proposal Lens is retired.")


if __name__ == "__main__":
    unittest.main()
