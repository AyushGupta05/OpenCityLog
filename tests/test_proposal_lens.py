import unittest


class RetiredProposalLensTests(unittest.TestCase):
    @unittest.skip("Retired Proposal Lens is quarantined by the active 15-lens city atlas contract.")
    def test_retired_proposal_lens_placeholder(self) -> None:
        self.fail("Proposal Lens tests must not run while the feature is retired.")


if __name__ == "__main__":
    unittest.main()
